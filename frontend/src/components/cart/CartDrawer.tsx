import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Minus, Plus, Trash2, XCircle } from 'lucide-react';

import { formatPrice } from '../../lib/currency';
import { useCartStore } from '../../store/cartStore';
import type { CartItem } from '../../store/cartStore';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { items, upsertItem, removeItem, clear } = useCartStore();
  const subtotal = items.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);

  const adjustQuantity = (item: CartItem, delta: number) => {
    if (item.quantity + delta <= 0) {
      removeItem(item.id);
      return;
    }
    upsertItem({ ...item, quantity: delta });
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md bg-white shadow-2xl">
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">Shopping Cart</Dialog.Title>
                      <button onClick={onClose} className="text-slate-400 transition hover:text-slate-600">
                        <XCircle size={24} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      {items.length === 0 ? (
                        <p className="text-sm text-slate-500">Your cart is empty. Explore fresh launches and bestseller deals.</p>
                      ) : (
                        <ul className="space-y-6">
                          {items.map((item: CartItem) => (
                            <li key={item.id} className="flex gap-4">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
                              />
                              <div className="flex flex-1 flex-col">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                    {item.variant && <p className="text-xs text-slate-500">{item.variant}</p>}
                                  </div>
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="text-slate-400 transition hover:text-red-500"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                                    <button
                                      onClick={() => adjustQuantity(item, -1)}
                                      className="text-slate-500 transition hover:text-brand-500"
                                    >
                                      <Minus size={16} />
                                    </button>
                                    <span className="w-6 text-center font-semibold">{item.quantity}</span>
                                    <button
                                      onClick={() => adjustQuantity(item, 1)}
                                      className="text-slate-500 transition hover:text-brand-500"
                                    >
                                      <Plus size={16} />
                                    </button>
                                  </div>
                                  <span className="font-semibold text-slate-900">
                                    {formatPrice(item.price * item.quantity, item.currency)}
                                  </span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="border-t border-slate-200 px-6 py-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="text-lg font-semibold text-slate-900">
                          {items.length > 0 ? formatPrice(subtotal, items[0].currency) : formatPrice(0)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Taxes and shipping calculated at checkout. Pay securely with Stripe.
                      </p>
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={clear}
                          className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Clear Cart
                        </button>
                        <button className="flex-1 rounded-full bg-brand-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-600">
                          Proceed to Checkout
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
