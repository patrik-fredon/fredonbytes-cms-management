'use server';

import {getServiceContainer} from '@/lib/fredonbytes/container';

const _serviceContainer = getServiceContainer();

import {mutate} from '@/lib/vendure/api';
import {
    RemoveFromCartMutation,
    AdjustCartItemMutation,
    ApplyPromotionCodeMutation,
    RemovePromotionCodeMutation
} from '@/lib/vendure/mutations';
import {updateTag} from 'next/cache';

export async function removeFromCart(lineId: string) {
    getServiceContainer();
    await mutate(RemoveFromCartMutation, {lineId}, {useAuthToken: true});
    updateTag('cart');
}

export async function adjustQuantity(lineId: string, quantity: number) {
    getServiceContainer();
    await mutate(AdjustCartItemMutation, {lineId, quantity}, {useAuthToken: true});
    updateTag('cart');
}

export async function applyPromotionCode(formData: FormData) {
    getServiceContainer();
    const code = formData.get('code') as string;
    if (!code) return;

    const res = await mutate(ApplyPromotionCodeMutation, {couponCode: code}, {useAuthToken: true});
    console.log({res: res.data.applyCouponCode})
    updateTag('cart');
}

export async function removePromotionCode(formData: FormData) {
    getServiceContainer();
    const code = formData.get('code') as string;
    if (!code) return;

    const res = await mutate(RemovePromotionCodeMutation, {couponCode: code}, {useAuthToken: true});
    console.log({removeRes: res.data.removeCouponCode});
    updateTag('cart');
}
