import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { RestaurantService } from '../restaurant/restaurant.service';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../orders/order.service';
import { ReviewsService } from '../reviews/reviews.service';

export interface AIChatMessage {
  role: 'user' | 'model';
  parts: Array<{
    text?: string;
    functionCall?: any;
    functionResponse?: any;
  }>;
}

const SYSTEM_PROMPT = `You are OFOS AI Food Assistant.
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

const tools: any = [
  {
    functionDeclarations: [
      {
        name: 'search_restaurants',
        description: 'Search/filter approved restaurants.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            search: { type: Type.STRING, description: 'Keyword or cuisine' },
            city: { type: Type.STRING, description: 'City name' },
            foodType: { type: Type.STRING, description: 'VEG, NON_VEG, or VEGAN' },
            page: { type: Type.NUMBER },
            limit: { type: Type.NUMBER },
          },
        },
      },
      {
        name: 'get_restaurant_details',
        description: 'Get details and coupons of a restaurant.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            restaurantId: { type: Type.STRING, description: 'Restaurant ID' },
          },
          required: ['restaurantId'],
        },
      },
      {
        name: 'get_restaurant_menu',
        description: 'Get menu categories and items for a restaurant.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            restaurantId: { type: Type.STRING, description: 'Restaurant ID' },
          },
          required: ['restaurantId'],
        },
      },
      {
        name: 'search_menu_items',
        description: 'Global search for specific dishes/food items across all restaurants.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            search: { type: Type.STRING, description: 'Search term (e.g. pizza, burger, biryani)' },
            foodType: { type: Type.STRING, description: 'VEG, NON_VEG, or VEGAN' },
            page: { type: Type.NUMBER },
            limit: { type: Type.NUMBER },
          },
        },
      },
      {
        name: 'get_user_orders',
        description: 'Retrieve order history of the logged-in user.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            page: { type: Type.NUMBER },
            limit: { type: Type.NUMBER },
          },
        },
      },
      {
        name: 'get_user_cart',
        description: 'Get current user active cart items.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
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
            specialInstructions: { type: Type.STRING, description: 'Cooking instructions' },
          },
          required: ['menuItemId', 'restaurantBranchId', 'quantity'],
        },
      },
      {
        name: 'clear_cart',
        description: 'Clear all items from active cart.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'get_restaurant_reviews',
        description: 'Get customer reviews for a restaurant.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            restaurantId: { type: Type.STRING, description: 'Restaurant ID' },
            page: { type: Type.NUMBER },
            limit: { type: Type.NUMBER },
          },
          required: ['restaurantId'],
        },
      },
    ],
  },
];

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private memoryHistory = new Map<string, { history: AIChatMessage[]; updatedAt: number }>();

  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly reviewsService: ReviewsService,
  ) {}

  private getHistory(userId: string): AIChatMessage[] {
    const entry = this.memoryHistory.get(userId);
    if (!entry) return [];
    if (Date.now() - entry.updatedAt > 3600000) {
      this.memoryHistory.delete(userId);
      return [];
    }
    return entry.history.map((h) => ({ role: h.role, parts: [...h.parts] }));
  }

  private setHistory(userId: string, history: AIChatMessage[]) {
    this.memoryHistory.set(userId, { history, updatedAt: Date.now() });
  }

  clearHistory(userId: string) {
    this.memoryHistory.delete(userId);
  }

  async processChat(userId: string, message: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not defined. Using intelligent local OFOS AI engine.');
      return this.localFallbackResponse(userId, message);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      let chatHistory = this.getHistory(userId);

      chatHistory.push({
        role: 'user',
        parts: [{ text: message }],
      });

      let loopCount = 0;
      let finalResponseText = '';
      const toolCache = new Map<string, any>();

      while (loopCount < 8) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: chatHistory as any[],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            tools,
          },
        });

        const calls = response.functionCalls;
        if (!calls || calls.length === 0) {
          finalResponseText = response.text || '';
          chatHistory.push({
            role: 'model',
            parts: (response.candidates?.[0]?.content?.parts || [{ text: finalResponseText }]) as any[],
          });
          break;
        }

        chatHistory.push({
          role: 'model',
          parts: (response.candidates?.[0]?.content?.parts || []) as any[],
        });

        const functionParts: any[] = [];
        for (const call of calls) {
          if (!call.name) continue;
          const cacheKey = `${call.name}:${JSON.stringify(call.args)}`;
          let toolResult: any;

          if (toolCache.has(cacheKey)) {
            toolResult = toolCache.get(cacheKey);
          } else {
            toolResult = await this.executeTool(call.name, call.args, userId);
            toolCache.set(cacheKey, toolResult);
          }

          const structResponse = Array.isArray(toolResult)
            ? { items: toolResult }
            : typeof toolResult === 'object' && toolResult !== null
            ? toolResult
            : { result: toolResult };

          functionParts.push({
            functionResponse: {
              name: call.name,
              response: structResponse,
            },
          });
        }

        chatHistory.push({
          role: 'user',
          parts: functionParts,
        });

        loopCount++;
      }

      const textOnly = chatHistory.filter((turn) =>
        turn.parts && turn.parts.some((p) => p.text && p.text.trim().length > 0),
      );
      this.setHistory(userId, textOnly.slice(-12));

      return finalResponseText || 'I found some great options for you on OFOS!';
    } catch (err: any) {
      this.logger.error(`Gemini API error: ${err.message}. Falling back to local assistant response.`);
      return this.localFallbackResponse(userId, message);
    }
  }

  private async localFallbackResponse(userId: string, message: string): Promise<string> {
    const lower = message.toLowerCase();

    // Check for order query
    if (lower.includes('order') || lower.includes('history') || lower.includes('past')) {
      const orders = await this.toolGetUserOrders(userId, 1, 3);
      if (!orders || orders.length === 0) {
        return 'You do not have any past orders on OFOS yet. Check out our menu to order something delicious!';
      }
      const summary = orders
        .map((o: any) => `Order #${o.id} (${o.status}) - ₹${o.total}`)
        .join(', ');
      return `Here are your recent OFOS orders: ${summary}.`;
    }

    // Check for cart query
    if (lower.includes('cart') || lower.includes('bag')) {
      const cart = await this.toolGetUserCart(userId);
      if (!cart || !cart.items || cart.items.length === 0) {
        return 'Your OFOS cart is currently empty. Would you like me to recommend some popular dishes?';
      }
      return `You have ${cart.items.length} item(s) in your OFOS cart (Total: ₹${cart.total}). Ready to checkout?`;
    }

    // Check for restaurants query
    if (lower.includes('restaurant') || lower.includes('place') || lower.includes('near')) {
      const restaurants = await this.toolSearchRestaurants('', '', undefined, 1, 5);
      if (restaurants && restaurants.length > 0) {
        return `Here are top approved restaurants available on OFOS:\n<restaurants>${JSON.stringify(restaurants)}</restaurants>`;
      }
    }

    // Food keyword search
    const cleanWord = lower
      .replace(/find|show|me|some|recommend|food|dish|dishes|popular|top|please|can|you|get|want|i/gi, '')
      .trim();

    const searchKeyword = cleanWord.length > 0 ? cleanWord : '';
    const items = await this.toolSearchMenuItems(searchKeyword, undefined, 1, 6);

    if (items && items.length > 0) {
      return `Here are top recommendations from OFOS for "${searchKeyword || 'you'}":\n<menu_items>${JSON.stringify(items)}</menu_items>`;
    }

    return 'Welcome to OFOS Food Assistant! You can ask me to search dishes (e.g. "find pizza", "show biryani"), check restaurants, or view your current cart and past orders.';
  }

  private async executeTool(name: string, args: any, userId: string): Promise<any> {
    try {
      switch (name) {
        case 'search_restaurants':
          return await this.toolSearchRestaurants(args.search, args.city, args.foodType, args.page, args.limit);
        case 'get_restaurant_details':
          return await this.toolGetRestaurantDetails(args.restaurantId);
        case 'get_restaurant_menu':
          return await this.toolGetRestaurantMenu(args.restaurantId);
        case 'search_menu_items':
          return await this.toolSearchMenuItems(args.search, args.foodType, args.page, args.limit);
        case 'get_user_orders':
          return await this.toolGetUserOrders(userId, args.page, args.limit);
        case 'get_user_cart':
          return await this.toolGetUserCart(userId);
        case 'add_item_to_cart':
          return await this.toolAddItemToCart(userId, args);
        case 'clear_cart':
          return await this.toolClearCart(userId);
        case 'get_restaurant_reviews':
          return await this.toolGetRestaurantReviews(args.restaurantId, args.page, args.limit);
        default:
          return { error: `Unknown tool: ${name}` };
      }
    } catch (err: any) {
      return { error: err.message };
    }
  }

  private async toolSearchRestaurants(search?: string, city?: string, foodType?: any, page = 1, limit = 5) {
    const result = await this.restaurantService.getRestaurants({
      search,
      city,
      cuisine: foodType,
      page,
      limit,
    });

    const list = result.data || [];
    return list.map((r: any) => ({
      id: r.id,
      name: r.businessName,
      rating: r.averageRating,
      description: r.description ? r.description.slice(0, 80) : '',
      coupons: Array.isArray(r.applicableCoupons) ? r.applicableCoupons.map((c: any) => c.code) : [],
      branches: Array.isArray(r.branches)
        ? r.branches.map((b: any) => ({
            id: b.id,
            city: b.city,
            area: b.area,
          }))
        : [],
    }));
  }

  private async toolGetRestaurantDetails(restaurantId: string) {
    const r: any = await this.restaurantService.getRestaurantById(BigInt(restaurantId));
    if (!r) return { error: 'Restaurant not found' };
    return {
      id: r.id,
      name: r.businessName,
      description: r.description,
      rating: r.averageRating,
      reviewsCount: r.totalReviews,
      coupons: Array.isArray(r.applicableCoupons)
        ? r.applicableCoupons.map((c: any) => ({ code: c.code, desc: c.description }))
        : [],
      branches: Array.isArray(r.branches)
        ? r.branches.map((b: any) => ({
            id: b.id?.toString(),
            city: b.city,
            area: b.area,
            address: b.addressLine1,
          }))
        : [],
    };
  }

  private async toolGetRestaurantMenu(restaurantId: string) {
    const result: any = await this.restaurantService.getRestaurantMenu(BigInt(restaurantId));
    if (!result || !result.categories) return result;
    return {
      restaurantId: result.restaurantId,
      categories: result.categories.map((c: any) => ({
        name: c.name,
        items: Array.isArray(c.items)
          ? c.items.map((i: any) => ({
              id: i.id,
              name: i.name,
              price: i.basePrice,
              foodType: i.foodType,
              bestseller: i.isBestseller || undefined,
              desc: i.description ? i.description.slice(0, 40) : undefined,
            }))
          : [],
      })),
    };
  }

  private async toolSearchMenuItems(search?: string, foodType?: any, page = 1, limit = 6) {
    const result = await this.restaurantService.getGlobalMenuItems({
      search,
      foodType,
      page,
      limit,
    });

    const list = result.data || [];
    return list.map((item: any) => ({
      id: item.id?.toString(),
      name: item.name,
      price: Number(item.basePrice),
      foodType: item.foodType,
      bestseller: item.isBestseller || undefined,
      desc: item.description ? item.description.slice(0, 40) : undefined,
      restaurant: item.category?.branch?.restaurant?.businessName,
      branchId: item.category?.branchId?.toString(),
    }));
  }

  private async toolGetUserOrders(userId: string, page = 1, limit = 5) {
    const result: any = await this.orderService.getCustomerOrders(BigInt(userId), page, limit);
    const list = result.data || [];
    return list.map((order: any) => ({
      id: order.id?.toString(),
      status: order.orderStatus,
      total: Number(order.totalAmount),
      date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : undefined,
      items: Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            name: item.itemName,
            qty: item.quantity,
            price: Number(item.price),
          }))
        : [],
    }));
  }

  private async toolGetUserCart(userId: string) {
    const cart: any = await this.cartService.getCart(BigInt(userId));
    if (!cart) return { message: 'Your cart is currently empty.' };
    return {
      cartId: cart.id?.toString(),
      branchId: cart.restaurantBranchId?.toString(),
      subtotal: Number(cart.subtotalAmount || 0),
      delivery: Number(cart.deliveryFee || 0),
      tax: Number(cart.taxAmount || 0),
      total: Number(cart.totalAmount || 0),
      items: Array.isArray(cart.items)
        ? cart.items.map((item: any) => ({
            id: item.id?.toString(),
            itemId: item.menuItemId?.toString(),
            name: item.menuItem?.name || item.itemName,
            qty: item.quantity,
            price: Number(item.unitPrice),
          }))
        : [],
    };
  }

  private async toolAddItemToCart(userId: string, args: any) {
    try {
      const res = await this.cartService.addToCart(BigInt(userId), {
        menuItemId: args.menuItemId,
        restaurantBranchId: args.restaurantBranchId,
        quantity: Number(args.quantity) || 1,
        specialInstructions: args.specialInstructions,
      });
      return { success: true, message: 'Item added to cart successfully', data: res };
    } catch (err: any) {
      if (err.message && err.message.includes('different branch')) {
        return {
          error: 'DIFFERENT_RESTAURANT_CART_EXISTS',
          message: 'Your cart contains items from a different restaurant. Would you like to clear it first?',
        };
      }
      return { error: err.message };
    }
  }

  private async toolClearCart(userId: string) {
    const res = await this.cartService.clearCart(BigInt(userId));
    return { success: true, message: 'Cart cleared successfully', data: res };
  }

  private async toolGetRestaurantReviews(restaurantId: string, page = 1, limit = 5) {
    const result: any = await this.reviewsService.getRestaurantReviews(Number(restaurantId), {
      page,
      limit,
    });
    const list = result.data || [];
    return list.map((review: any) => ({
      rating: Number(review.overallRating),
      text: review.reviewText ? review.reviewText.slice(0, 80) : '',
      user: review.customer?.user
        ? `${review.customer.user.firstName} ${review.customer.user.lastName?.[0] || ''}.`
        : 'Anonymous',
    }));
  }
}
