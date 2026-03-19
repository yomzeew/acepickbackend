export enum OTPReason {
    VERIFICATION = 'verification',
    FORGOT_PASSWORD = 'forgot_password'
}


export enum VerificationType {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    BOTH = 'BOTH',
    // RESET = 'RESET',
}

export enum UserRole {
    SUPERADMIN = 'superadmin',
    ADMIN = 'admin',
    PROFESSIONAL = 'professional',
    CLIENT = 'client',
    CORPERATE = 'corperate',
    DELIVERY = 'delivery',
}


export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
}


export enum UserState {
    STEP_ONE = 'STEP_ONE',
    STEP_TWO = 'STEP_TWO',
    STEP_THREE = 'STEP_THREE',
    VERIFIED = 'VERIFIED',
}


export enum JobMode {
    VIRTUAL = "VIRTUAL",
    PHYSICAL = "PHYSICAL"
}


export enum PayStatus {
    UNPAID = 'unpaid',
    PAID = 'paid',
    //PARTIALLY_PAID = 'partially_paid',
    REFUNDED = 'refunded',
    RELEASED = 'released',
}

export enum ActivityStatus {
    ACT_SUCCESS = 'act_success',
    ACT_FAILED = 'act_failed',
    ACT_PENDING = 'act_pending'
}

export enum JobStatus {
    COMPLETED = 'COMPLETED',
    APPROVED = 'APPROVED',
    DISPUTED = 'DISPUTED',
    PENDING = 'PENDING',
    DECLINED = 'DECLINED',
    ONGOING = "ONGOING",
    CANCELLED = "CANCELLED",
    REJECTED = "REJECTED",
}


export enum PaidFor {
    WORKMANSHIP = 'workmanship',
    MATERIAL = 'material',
    BOTH = 'both'
}

export enum TransactionStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
    PENDING = 'pending',
}

export enum TransactionType {
    DEBIT = 'debit',
    CREDIT = 'credit'
}

export enum TransferStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
    PENDING = 'pending'
}

export enum ProductStatus {
    SOLD = 'sold',
    BOUGHT = 'bought'
}

export enum ENV {
    PROD = 'prod',
    DEV = 'dev',
}


export enum ProductTransactionStatus {
    PENDING = 'pending',
    ORDERED = 'ordered',
    ACCEPTED_BY_SELLER = 'accepted_by_seller',
    REJECTED_BY_SELLER = 'rejected_by_seller',
    READY_FOR_DELIVERY = 'ready_for_delivery',
    DELIVERED = 'delivered',
    AWAITING_CONFIRMATION = 'awaiting_confirmation',
    COMPLETED = 'completed',
    RETURN_REQUESTED = 'return_requested',
    RETURNED = 'returned',
    CANCELLED = 'cancelled',
    DISPUTED = 'disputed'
}

export enum ReturnStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

export enum OrderMethod {
    SELF_PICKUP = "self_pickup",
    DELIVERY = "delivery",
}

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    ACCEPTED = 'accepted',
    EN_ROUTE_TO_PICKUP = 'en_route_to_pickup',
    ARRIVED_AT_PICKUP = 'arrived_at_pickup',
    PICKED_UP = 'picked_up',
    CONFIRM_PICKUP = 'confirm_pickup',
    IN_TRANSIT = 'in_transit',
    ARRIVED_AT_DROPOFF = 'arrived_at_dropoff',
    DELIVERED = 'delivered',
    CONFIRM_DELIVERY = 'confirm_delivery',
    CANCELLED = 'cancelled',
    DISPUTED = 'disputed',
    EXPIRED = 'expired',
    NOT_REQUIRED = 'not_required',
}

export enum TransactionDescription {
    JOB_PAYMENT = 'job payment',
    PRODUCT_PAYMENT = 'product payment',
    PRODUCT_ORDER_PAYMENT = 'product_order payment',
    WALLET_TOPUP = 'wallet topup'
}

export enum VehicleType {
    CAR = 'car',
    BIKE = 'bike',
    BUS = 'bus',
    TRUCK = 'truck',
    KEKE = 'keke'
}

export enum RiderStatus {
    BUSY = 'busy',
    AVAILABLE = 'available',
    SUSPENDED = 'suspended',
    INACTIVE = 'inactive',
}

export enum Accounts {
    USER_WALLET = "user_wallet",
    PLATFORM_ESCROW = "platform_escrow",
    PLATFORM_REVENUE = "platform_revenue",
    PAYMENT_GATEWAY = "payment_gateway",
    PROFESSIONAL_WALLET = "professional_wallet"
}

export enum CommissionType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed'
}

export enum CommissionScope {
    JOB = 'job',
    PRODUCT = 'product',
    DELIVERY = 'delivery',
    ALL = 'all'
}

export enum EntryCategory {
    JOB = 'job',
    PRODUCT = 'product',
    DELIVERY = 'delivery',
}

export enum NotificationType {
    JOB = 'job',
    ORDER = 'order',
    PAYMENT = 'payment',
    CHAT = 'chat',
    SYSTEM = 'system',
    PROFILE = 'profile',
}
