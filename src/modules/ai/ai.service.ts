import { GoogleGenAI, Type } from '@google/genai';
import redisService from '../../services/redisService.ts';
import * as restaurantService from '../restuarant/restaurant.service.ts';
import orderService from '../orders/order.service.ts';
import { getCartService, addItemToCartService, clearCartService } from '../cart/cart.service.ts';
import * as reviewsService from '../reviews/reviews.service.ts';
import { IChatMessage } from './ai.interface.ts';

// Optimized compact system prompt preserving all instructions, constraints, and XML formatting instructions
const SYSTEM_PROMPT = `You are Epicure AI Food Assistant.
Guidelines:
1. Assist only with food, restaurants, reviews, cart, and orders. Avoid unrelated topics.
2. Never hallucinate. Always fetch real data using tools. State clearly if no results found.
3. Recommend meals/restaurants by searching first, then suggest matching items under budget.
4. If add_item_to_cart fails with DIFFERENT_RESTAURANT_CART_EXISTS, explain, ask to clear cart. If approved, call clear_cart then add_item_to_cart.
5. Quote prices in Indian Rupees (e.g. ₹500). Ratings/prices must match tool outputs exactly.
6. ALWAYS format list results as JSON inside these exact tags (never write raw JSON arrays, bullet points, or markdown tables):
   - Restaurants: <restaurants>[{"id","name","rating","description","coupons","branches":[{"id","city","area"}]}]</restaurants>
   - Menu/Food recommendations: <menu_items>[{"id","name","price","foodType","bestseller","desc","restaurant","branchId"}]</menu_items>
Keep text brief and do not invent field values.`;

// Highly optimized, concise tool declarations to minimize prompt schema tokens
const tools: any = [
  {
    functionDeclarations: [
      {
        name: 'search_restaurants',
        description: 'Search/filter approved restaurants.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            search: { type: Type.STRING, description: 'Keyword' },
            city: { type: Type.STRING, description: 'City name' },
            foodType: { type: Type.STRING, description: 'VEG, NON_VEG, or VEGAN' },
            page: { type: Type.NUMBER },
            limit: { type: Type.NUMBER }
          }
        }
      },
      {
        name: 'get_restaurant_details',
        description: 'Get details and coupons of a restaurant.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            restaurantId: { type: Type.STRING, description: 'Restaurant ID' }
          },
          required: ['restaurantId']
        }
      },
      {
        name: 'get_restaurant_menu',
        description: 'Get menu categories and items for a restaurant.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            restaurantId: { type: Type.STRING, description: 'Restaurant ID' }
          },
          required: ['restaurantId']
        }
      },
      {
        name: 'search_menu_items',
        description: 'Global search for specific dishes/food items.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            search: { type: Type.STRING, description: 'Search term' },
            foodType: { type: Type.STRING, description: 'VEG, NON_VEG, or VEGAN' },
            page: { type: Type.NUMBER },
            limit: { type: Type.NUMBER }
          }
        }
      },
      {
        name: 'get_user_orders',
        description: 'Retrieve order history of the logged-in user.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            page: { type: Type.NUMBER },
            limit: { type: Type.NUMBER }
          }
        }
      },
      {
        name: 'get_user_cart',
        description: 'Get current user active cart items.',
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      },
      {
        name: 'add_item_to_cart',
        description: 'Add a menu item to the user active cart.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            menuItemId: { type: Type.STRING, description: 'Menu item ID' },
            restaurantBranchId: { type: Type.STRING, description: 'Branch ID' },
            quantity: { type: Type.NUMBER, description: 'Quantity >= 1' },
            specialInstructions: { type: Type.STRING, description: 'Cooking instructions' }
          },
          required: ['menuItemId', 'restaurantBranchId', 'quantity']
        }
      },
      {
        name: 'clear_cart',
        description: 'Clear all items from active cart.',
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      },
      {
        name: 'get_restaurant_reviews',
        description: 'Get customer reviews for a restaurant.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            restaurantId: { type: Type.STRING, description: 'Restaurant ID' },
            page: { type: Type.NUMBER },
            limit: { type: Type.NUMBER }
          },
          required: ['restaurantId']
        }
      }
    ]
  }
];

const executeTool = async (name: string, args: any, customerUserId: bigint) => {
  console.log(`[AI Tool Executing] ${name} with args:`, JSON.stringify(args));
  const startTime = Date.now();
  try {
    let result: any;
    switch (name) {
      case 'search_restaurants': {
        result = await restaurantService.getRestaurants({
          search: args.search,
          city: args.city,
          foodType: args.foodType,
          page: args.page,
          limit: args.limit
        });
        break;
      }
      case 'get_restaurant_details': {
        result = await restaurantService.getRestaurantDetails(args.restaurantId);
        break;
      }
      case 'get_restaurant_menu': {
        result = await restaurantService.getRestaurantMenu(args.restaurantId);
        break;
      }
      case 'search_menu_items': {
        result = await restaurantService.getGlobalMenuItems({
          search: args.search,
          foodType: args.foodType,
          page: args.page,
          limit: args.limit
        });
        break;
      }
      case 'get_user_orders': {
        const page = args.page || 1;
        const limit = args.limit || 10;
        result = await orderService.getOrders(customerUserId, page, limit);
        break;
      }
      case 'get_user_cart': {
        try {
          result = await getCartService(customerUserId);
        } catch (err: any) {
          if (err.message === 'No active cart found') {
            result = { message: 'Your cart is currently empty.' };
          } else {
            throw err;
          }
        }
        break;
      }
      case 'add_item_to_cart': {
        result = await addItemToCartService(customerUserId, {
          menuItemId: BigInt(args.menuItemId),
          restaurantBranchId: BigInt(args.restaurantBranchId),
          quantity: Number(args.quantity),
          specialInstructions: args.specialInstructions
        });
        break;
      }
      case 'clear_cart': {
        result = await clearCartService(customerUserId);
        break;
      }
      case 'get_restaurant_reviews': {
        result = await reviewsService.getRestaurantReviews(BigInt(args.restaurantId), {
          page: args.page,
          limit: args.limit
        });
        break;
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    const duration = Date.now() - startTime;
    console.log(`[AI Tool Completed] ${name} in ${duration}ms`);
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[AI Tool Error] ${name} failed in ${duration}ms:`, error.message);
    return { error: error.message };
  }
};

// Lightweight minification helpers to minimize tokens in function response turns
function minifyRestaurants(result: any) {
  if (!result || !result.data) return result;
  const list = result.data.map((r: any) => ({
    id: r.id,
    name: r.businessName,
    rating: r.averageRating,
    description: r.description ? r.description.slice(0, 80) : undefined,
    coupons: Array.isArray(r.applicableCoupons) ? r.applicableCoupons.map((c: any) => c.code) : [],
    branches: Array.isArray(r.branches) ? r.branches.map((b: any) => ({
      id: b.id,
      city: b.city,
      area: b.area
    })) : []
  }));
  return { restaurants: list };
}

function minifyRestaurantDetails(result: any) {
  if (!result) return result;
  return {
    id: result.id,
    name: result.businessName,
    description: result.description,
    rating: result.averageRating,
    reviewsCount: result.totalReviews,
    coupons: Array.isArray(result.applicableCoupons) ? result.applicableCoupons.map((c: any) => ({ code: c.code, desc: c.description })) : [],
    branches: Array.isArray(result.branches) ? result.branches.map((b: any) => ({
      id: b.id?.toString(),
      city: b.city,
      area: b.area,
      address: b.addressLine1
    })) : []
  };
}

function minifyMenu(result: any) {
  if (!result || !result.categories) return result;
  return {
    restaurantId: result.restaurantId,
    categories: result.categories.map((c: any) => ({
      name: c.name,
      items: Array.isArray(c.items) ? c.items.map((i: any) => ({
        id: i.id,
        name: i.name,
        price: i.basePrice,
        foodType: i.foodType,
        bestseller: i.isBestseller || undefined,
        desc: i.description ? i.description.slice(0, 40) : undefined
      })) : []
    }))
  };
}

function minifyGlobalMenuItems(result: any) {
  if (!result || !result.data) return result;
  const list = result.data.map((item: any) => ({
    id: item.id?.toString(),
    name: item.name,
    price: Number(item.basePrice),
    foodType: item.foodType,
    bestseller: item.isBestseller || undefined,
    desc: item.description ? item.description.slice(0, 40) : undefined,
    restaurant: item.category?.branch?.restaurant?.businessName,
    branchId: item.category?.branchId?.toString()
  }));
  return { items: list };
}

function minifyOrders(result: any) {
  if (!result || !result.data) return result;
  const list = result.data.map((order: any) => ({
    id: order.id?.toString(),
    status: order.orderStatus || order.status,
    total: Number(order.totalAmount),
    date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : undefined,
    items: Array.isArray(order.items) ? order.items.map((item: any) => ({
      name: item.itemName || item.name,
      qty: item.quantity,
      price: Number(item.price)
    })) : []
  }));
  return { orders: list };
}

function minifyCart(result: any) {
  if (!result) return null;
  if (result.message) return result;
  return {
    cartId: result.id?.toString(),
    branchId: result.restaurantBranchId?.toString(),
    subtotal: Number(result.subtotalAmount),
    delivery: Number(result.deliveryFee),
    tax: Number(result.taxAmount),
    total: Number(result.totalAmount),
    items: Array.isArray(result.items) ? result.items.map((item: any) => ({
      id: item.id?.toString(),
      itemId: item.menuItemId?.toString(),
      name: item.itemName,
      qty: item.quantity,
      price: Number(item.price)
    })) : []
  };
}

function minifyReviews(result: any) {
  if (!result || !result.data) return result;
  const list = result.data.map((review: any) => ({
    rating: Number(review.overallRating),
    text: review.reviewText ? review.reviewText.slice(0, 80) : '',
    user: review.customer?.user ? `${review.customer.user.firstName} ${review.customer.user.lastName[0]}.` : 'Anonymous'
  }));
  return { reviews: list };
}

function sanitizeChatHistory(history: IChatMessage[]): IChatMessage[] {
  const sanitized: IChatMessage[] = [];

  for (let i = 0; i < history.length; i++) {
    const turn = history[i];

    if (!turn || !Array.isArray(turn.parts) || turn.parts.length === 0) {
      continue;
    }

    const isModelCall = turn.role === 'model' && turn.parts.some(p => p.functionCall !== undefined);

    if (isModelCall) {
      const nextTurn = history[i + 1];
      const hasFunctionResponse = nextTurn && nextTurn.role === 'user' && 
                                  Array.isArray(nextTurn.parts) && 
                                  nextTurn.parts.some(p => p.functionResponse !== undefined);

      if (hasFunctionResponse) {
        sanitized.push({ role: turn.role, parts: [...turn.parts] });
        sanitized.push({ role: nextTurn.role, parts: [...nextTurn.parts] });
        i++;
      } else {
        console.warn(`[AI Chat] Dropped model turn at index ${i} with function calls because it lacks a following user turn with function responses.`);
      }
    } else {
      const isUserResponse = turn.role === 'user' && turn.parts.some(p => p.functionResponse !== undefined);
      if (isUserResponse) {
        console.warn(`[AI Chat] Dropped orphan user turn at index ${i} with function responses.`);
      } else {
        sanitized.push({ role: turn.role, parts: [...turn.parts] });
      }
    }
  }

  const finalHistory: IChatMessage[] = [];
  for (const turn of sanitized) {
    if (finalHistory.length === 0) {
      if (turn.role === 'user') {
        finalHistory.push(turn);
      } else {
        console.warn(`[AI Chat] Dropped leading model/non-user turn in history.`);
      }
    } else {
      const prevTurn = finalHistory[finalHistory.length - 1];
      if (prevTurn.role === turn.role) {
        prevTurn.parts = [...prevTurn.parts, ...turn.parts];
        console.warn(`[AI Chat] Merged consecutive turns of role: ${turn.role}`);
      } else {
        finalHistory.push(turn);
      }
    }
  }

  return finalHistory;
}

// Compacts older text messages to drop verbose JSON lists while retaining textual/conversational context
function compactOlderMessages(history: IChatMessage[], keepCount: number = 4): IChatMessage[] {
  const result: IChatMessage[] = [];
  const cutoffIndex = history.length - keepCount;

  for (let i = 0; i < history.length; i++) {
    const turn = history[i];
    if (i < cutoffIndex) {
      const compactedParts = turn.parts.map(part => {
        if (part.text) {
          const cleanedText = part.text.replace(/<(restaurants|menu_items)>[\s\S]*?<\/\1>/g, '[list omitted]').trim();
          return { ...part, text: cleanedText };
        }
        return part;
      });
      result.push({ role: turn.role, parts: compactedParts });
    } else {
      result.push(turn);
    }
  }
  return result;
}

// Filters out any intermediate function calls/responses, keeping only user/model text turns for history storage
function filterTextOnlyMessages(history: IChatMessage[]): IChatMessage[] {
  const textOnly: IChatMessage[] = [];
  for (const turn of history) {
    if (!turn.parts || turn.parts.length === 0) continue;
    const textParts = turn.parts.filter(p => p.text !== undefined && p.text.trim() !== '');
    if (textParts.length > 0) {
      textOnly.push({
        role: turn.role,
        parts: textParts
      });
    }
  }
  return textOnly;
}

export async function processChat(customerUserId: bigint, message: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const cacheKey = `ai:history:${customerUserId}`;

  // Retrieve chat history
  let chatHistory = await redisService.get<IChatMessage[]>(cacheKey) || [];

  // Append new user message
  chatHistory.push({
    role: 'user',
    parts: [{ text: message }]
  });

  // Sanitize initial history to correct any state misalignment
  chatHistory = sanitizeChatHistory(chatHistory);

  let loopCount = 0;
  let finalResponseText = '';
  
  // Local request-scoped tool execution cache to avoid redundant round trips
  const toolCache = new Map<string, any>();

  while (loopCount < 10) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: chatHistory as any[],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools,
      }
    });

    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      finalResponseText = response.text || '';
      chatHistory.push({
        role: 'model',
        parts: (response.candidates?.[0]?.content?.parts || [{ text: finalResponseText }]) as any[]
      });
      break;
    }

    // Save model output containing the tool calls
    chatHistory.push({
      role: 'model',
      parts: (response.candidates?.[0]?.content?.parts || []) as any[]
    });

    // Execute all tools requested by the model
    const functionParts: any[] = [];
    for (const call of calls) {
      if (!call.name) continue;

      const cacheKeyStr = `${call.name}:${JSON.stringify(call.args)}`;
      let toolResult: any;

      if (toolCache.has(cacheKeyStr)) {
        toolResult = toolCache.get(cacheKeyStr);
      } else {
        toolResult = await executeTool(call.name, call.args, customerUserId);
        toolCache.set(cacheKeyStr, toolResult);
      }
      
      let prunedResult = toolResult;
      if (call.name === 'search_restaurants') {
        prunedResult = minifyRestaurants(toolResult);
      } else if (call.name === 'get_restaurant_details') {
        prunedResult = minifyRestaurantDetails(toolResult);
      } else if (call.name === 'get_restaurant_menu') {
        prunedResult = minifyMenu(toolResult);
      } else if (call.name === 'search_menu_items') {
        prunedResult = minifyGlobalMenuItems(toolResult);
      } else if (call.name === 'get_user_orders') {
        prunedResult = minifyOrders(toolResult);
      } else if (call.name === 'get_user_cart') {
        prunedResult = minifyCart(toolResult);
      } else if (call.name === 'get_restaurant_reviews') {
        prunedResult = minifyReviews(toolResult);
      }

      functionParts.push({
        functionResponse: {
          name: call.name,
          response: prunedResult
        }
      });
    }

    // Append function responses to history (role must be 'user' for Gemini API)
    chatHistory.push({
      role: 'user',
      parts: functionParts
    });

    loopCount++;
  }

  // Keep history size in Redis within bounds safely (last ~12 turns of text content)
  let redisHistory = filterTextOnlyMessages(chatHistory);
  if (redisHistory.length > 12) {
    let sliceIndex = redisHistory.length - 12;
    while (sliceIndex < redisHistory.length) {
      const turn = redisHistory[sliceIndex];
      const isUserText = turn && turn.role === 'user' && turn.parts && turn.parts.some((p: any) => p.text !== undefined);
      if (isUserText) {
        break;
      }
      sliceIndex++;
    }
    if (sliceIndex < redisHistory.length) {
      redisHistory = redisHistory.slice(sliceIndex);
    }
  }

  // Perform final sanitization pass and older XML JSON content compaction before saving to Redis
  const compactedHistory = compactOlderMessages(redisHistory, 4);
  const finalSanitizedHistory = sanitizeChatHistory(compactedHistory);
  await redisService.set(cacheKey, finalSanitizedHistory, 3600); // 1 hour TTL

  console.log('[AI Chat Reply Raw]:', JSON.stringify(finalResponseText));
  return finalResponseText;
}

export async function clearHistory(customerUserId: bigint): Promise<void> {
  const cacheKey = `ai:history:${customerUserId}`;
  await redisService.del(cacheKey);
}
