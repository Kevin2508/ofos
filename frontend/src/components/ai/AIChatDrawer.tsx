import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { apiClient } from '../../api/client';

interface AIChatDrawerProps {
  onSelectRestaurant?: (id: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  restaurants?: Array<{
    id: string;
    name: string;
    rating: number;
    description?: string;
    coupons?: string[];
    branches?: Array<{ id: string; city: string; area: string }>;
  }>;
  menuItems?: Array<{
    id: string;
    name: string;
    price: number;
    foodType?: string;
    bestseller?: boolean;
    desc?: string;
    restaurant?: string;
    branchId?: string;
  }>;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ onSelectRestaurant }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '👋 Hello! I am your OFOS AI Food Assistant. Ask me to recommend dishes, find top restaurants, or check your cart and past orders!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Parse custom tags like <restaurants>[...]</restaurants> and <menu_items>[...]</menu_items>
  const parseAIResponse = (rawText: string) => {
    let cleanText = rawText;
    let restaurants: any[] | undefined = undefined;
    let menuItems: any[] | undefined = undefined;

    const restMatch = cleanText.match(/<restaurants>([\s\S]*?)<\/restaurants>/);
    if (restMatch && restMatch[1]) {
      try {
        restaurants = JSON.parse(restMatch[1]);
        cleanText = cleanText.replace(/<restaurants>[\s\S]*?<\/restaurants>/, '').trim();
      } catch (e) {
        console.error('Failed to parse restaurants XML tag', e);
      }
    }

    const menuMatch = cleanText.match(/<menu_items>([\s\S]*?)<\/menu_items>/);
    if (menuMatch && menuMatch[1]) {
      try {
        menuItems = JSON.parse(menuMatch[1]);
        cleanText = cleanText.replace(/<menu_items>[\s\S]*?<\/menu_items>/, '').trim();
      } catch (e) {
        console.error('Failed to parse menu_items XML tag', e);
      }
    }

    return { cleanText, restaurants, menuItems };
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await apiClient.post<{ data: { reply: string } }>('/ai/chat', { message: text });
      const rawReply = res.data?.data?.reply || 'I am ready to help you with delicious meals on OFOS!';
      const { cleanText, restaurants, menuItems } = parseAIResponse(rawReply);

      const botMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: cleanText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        restaurants,
        menuItems,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'Sorry, I encountered an issue fetching recommendations. Please try again!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await apiClient.post('/ai/reset');
      setMessages([
        {
          id: String(Date.now()),
          sender: 'assistant',
          text: 'Memory cleared! What kind of food are you in the mood for now?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Failed to reset AI chat', err);
    }
  };

  const handleAddToCart = async (item: NonNullable<Message['menuItems']>[number]) => {
    if (!item.branchId) {
      alert('Branch information is missing for this dish.');
      return;
    }
    setAddingItemId(item.id);
    try {
      await addToCart({
        menuItemId: item.id,
        restaurantBranchId: item.branchId,
        quantity: 1,
      });
    } catch (e: any) {
      console.error('Failed to add to cart from AI', e);
    } finally {
      setAddingItemId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-medium px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          title="Open OFOS AI Food Assistant"
        >
          <span className="text-xl">✨</span>
          <span className="text-sm font-semibold tracking-wide">OFOS AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Chat Drawer Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[580px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg">
                ✨
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">OFOS AI Food Assistant</h3>
                <div className="flex items-center gap-1.5 text-xs text-orange-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Online & Ready</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition text-xs font-medium flex items-center gap-1"
                title="Reset Conversation"
              >
                <span>🔄</span>
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition text-sm ml-1"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-red-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Render Interactive Restaurants if present */}
                {msg.restaurants && msg.restaurants.length > 0 && (
                  <div className="w-full mt-2.5 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Recommended Restaurants
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.restaurants.map((r) => (
                        <div
                          key={r.id}
                          className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-red-300 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm">{r.name}</h4>
                              <p className="text-xs text-gray-500 line-clamp-1">{r.description}</p>
                            </div>
                            <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              ⭐ {r.rating ? Number(r.rating).toFixed(1) : 'New'}
                            </span>
                          </div>

                          {r.coupons && r.coupons.length > 0 && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                              <span>🏷️ Offer: {r.coupons[0]}</span>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setIsOpen(false);
                              if (onSelectRestaurant) {
                                onSelectRestaurant(r.id);
                              }
                            }}
                            className="mt-2 w-full text-center text-xs font-semibold py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition"
                          >
                            View Restaurant Menu →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render Interactive Menu Items if present */}
                {msg.menuItems && msg.menuItems.length > 0 && (
                  <div className="w-full mt-2.5 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Recommended Dishes
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.menuItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-red-300 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    item.foodType === 'VEG' ? 'bg-emerald-500' : 'bg-red-500'
                                  }`}
                                  title={item.foodType || 'Food'}
                                />
                                <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                                  {item.name}
                                </h4>
                                {item.bestseller && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                                    ★ Bestseller
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                                {item.restaurant}
                              </p>
                              {item.desc && (
                                <p className="text-xs text-gray-600 line-clamp-1 mt-1">{item.desc}</p>
                              )}
                            </div>
                            <span className="font-bold text-gray-900 text-sm">₹{item.price}</span>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">Freshly made</span>
                            <button
                              onClick={() => handleAddToCart(item)}
                              disabled={addingItemId === item.id}
                              className="text-xs font-semibold py-1 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-sm disabled:opacity-50"
                            >
                              {addingItemId === item.id ? 'Adding...' : '+ Add to Cart'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-100 rounded-2xl px-3.5 py-2 w-fit shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1 text-gray-600">OFOS AI is finding delicious choices...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => handleSend('Recommend top pizzas')}
              className="whitespace-nowrap px-2.5 py-1 bg-white border border-gray-200 hover:border-red-300 text-gray-700 rounded-full hover:bg-red-50 transition"
            >
              🍕 Top Pizzas
            </button>
            <button
              onClick={() => handleSend('Show biryani')}
              className="whitespace-nowrap px-2.5 py-1 bg-white border border-gray-200 hover:border-red-300 text-gray-700 rounded-full hover:bg-red-50 transition"
            >
              🍛 Biryani
            </button>
            <button
              onClick={() => handleSend('What is in my cart?')}
              className="whitespace-nowrap px-2.5 py-1 bg-white border border-gray-200 hover:border-red-300 text-gray-700 rounded-full hover:bg-red-50 transition"
            >
              🛒 My Cart
            </button>
            <button
              onClick={() => handleSend('Show my past orders')}
              className="whitespace-nowrap px-2.5 py-1 bg-white border border-gray-200 hover:border-red-300 text-gray-700 rounded-full hover:bg-red-50 transition"
            >
              📦 Past Orders
            </button>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask for food, restaurants, or orders..."
              className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-medium p-2 rounded-xl disabled:opacity-40 transition shadow-sm"
              title="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 004.835 9.25h8.415a.75.75 0 010 1.5H4.835a1.5 1.5 0 00-1.142 1.086L2.279 16.76a.75.75 0 00.95.826l14.5-6.25a.75.75 0 000-1.372l-14.5-6.25z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
