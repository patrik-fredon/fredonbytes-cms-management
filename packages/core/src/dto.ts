export interface ActiveCartDto {
  id: string;
  total: number;
}

export interface AddCartItemInputDto {
  cartId: string;
  variantId: string;
  quantity: number;
}

export interface PlaceOrderResultDto {
  orderCode: string;
}
