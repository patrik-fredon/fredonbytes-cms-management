import type {
  ActiveCartDto,
  AddCartItemInputDto,
  PlaceOrderResultDto,
} from "./dto";

export interface AuthService {
  signIn(input: {
    email: string;
    password: string;
  }): Promise<{
    userId: string;
  }>;
  signOut(): Promise<void>;
}

export interface CartService {
  getActiveCart(userId: string): Promise<ActiveCartDto>;
  addItem(input: AddCartItemInputDto): Promise<void>;
}

export interface CheckoutService {
  placeOrder(cartId: string): Promise<PlaceOrderResultDto>;
}
