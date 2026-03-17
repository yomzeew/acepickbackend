"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.EntryCategory = exports.CommissionScope = exports.CommissionType = exports.Accounts = exports.RiderStatus = exports.VehicleType = exports.TransactionDescription = exports.OrderStatus = exports.OrderMethod = exports.ProductTransactionStatus = exports.ENV = exports.ProductStatus = exports.TransferStatus = exports.TransactionType = exports.TransactionStatus = exports.PaidFor = exports.JobStatus = exports.ActivityStatus = exports.PayStatus = exports.JobMode = exports.UserState = exports.UserStatus = exports.UserRole = exports.VerificationType = exports.OTPReason = void 0;
var OTPReason;
(function (OTPReason) {
    OTPReason["VERIFICATION"] = "verification";
    OTPReason["FORGOT_PASSWORD"] = "forgot_password";
})(OTPReason || (exports.OTPReason = OTPReason = {}));
var VerificationType;
(function (VerificationType) {
    VerificationType["EMAIL"] = "EMAIL";
    VerificationType["SMS"] = "SMS";
    VerificationType["BOTH"] = "BOTH";
    // RESET = 'RESET',
})(VerificationType || (exports.VerificationType = VerificationType = {}));
var UserRole;
(function (UserRole) {
    UserRole["SUPERADMIN"] = "superadmin";
    UserRole["ADMIN"] = "admin";
    UserRole["PROFESSIONAL"] = "professional";
    UserRole["CLIENT"] = "client";
    UserRole["CORPERATE"] = "corperate";
    UserRole["DELIVERY"] = "delivery";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var UserState;
(function (UserState) {
    UserState["STEP_ONE"] = "STEP_ONE";
    UserState["STEP_TWO"] = "STEP_TWO";
    UserState["STEP_THREE"] = "STEP_THREE";
    UserState["VERIFIED"] = "VERIFIED";
})(UserState || (exports.UserState = UserState = {}));
var JobMode;
(function (JobMode) {
    JobMode["VIRTUAL"] = "VIRTUAL";
    JobMode["PHYSICAL"] = "PHYSICAL";
})(JobMode || (exports.JobMode = JobMode = {}));
var PayStatus;
(function (PayStatus) {
    PayStatus["UNPAID"] = "unpaid";
    PayStatus["PAID"] = "paid";
    //PARTIALLY_PAID = 'partially_paid',
    PayStatus["REFUNDED"] = "refunded";
    PayStatus["RELEASED"] = "released";
})(PayStatus || (exports.PayStatus = PayStatus = {}));
var ActivityStatus;
(function (ActivityStatus) {
    ActivityStatus["ACT_SUCCESS"] = "act_success";
    ActivityStatus["ACT_FAILED"] = "act_failed";
    ActivityStatus["ACT_PENDING"] = "act_pending";
})(ActivityStatus || (exports.ActivityStatus = ActivityStatus = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["COMPLETED"] = "COMPLETED";
    JobStatus["APPROVED"] = "APPROVED";
    JobStatus["DISPUTED"] = "DISPUTED";
    JobStatus["PENDING"] = "PENDING";
    JobStatus["DECLINED"] = "DECLINED";
    JobStatus["ONGOING"] = "ONGOING";
    JobStatus["CANCELLED"] = "CANCELLED";
    JobStatus["REJECTED"] = "REJECTED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var PaidFor;
(function (PaidFor) {
    PaidFor["WORKMANSHIP"] = "workmanship";
    PaidFor["MATERIAL"] = "material";
    PaidFor["BOTH"] = "both";
})(PaidFor || (exports.PaidFor = PaidFor = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["SUCCESS"] = "success";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["PENDING"] = "pending";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["DEBIT"] = "debit";
    TransactionType["CREDIT"] = "credit";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransferStatus;
(function (TransferStatus) {
    TransferStatus["SUCCESS"] = "success";
    TransferStatus["FAILED"] = "failed";
    TransferStatus["PENDING"] = "pending";
})(TransferStatus || (exports.TransferStatus = TransferStatus = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["SOLD"] = "sold";
    ProductStatus["BOUGHT"] = "bought";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var ENV;
(function (ENV) {
    ENV["PROD"] = "prod";
    ENV["DEV"] = "dev";
})(ENV || (exports.ENV = ENV = {}));
var ProductTransactionStatus;
(function (ProductTransactionStatus) {
    ProductTransactionStatus["PENDING"] = "pending";
    ProductTransactionStatus["ORDERED"] = "ordered";
    ProductTransactionStatus["DELIVERED"] = "delivered";
    ProductTransactionStatus["DISPUTED"] = "disputed";
})(ProductTransactionStatus || (exports.ProductTransactionStatus = ProductTransactionStatus = {}));
var OrderMethod;
(function (OrderMethod) {
    OrderMethod["SELF_PICKUP"] = "self_pickup";
    OrderMethod["DELIVERY"] = "delivery";
})(OrderMethod || (exports.OrderMethod = OrderMethod = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["PAID"] = "paid";
    OrderStatus["ACCEPTED"] = "accepted";
    OrderStatus["EN_ROUTE_TO_PICKUP"] = "en_route_to_pickup";
    OrderStatus["ARRIVED_AT_PICKUP"] = "arrived_at_pickup";
    OrderStatus["PICKED_UP"] = "picked_up";
    OrderStatus["CONFIRM_PICKUP"] = "confirm_pickup";
    OrderStatus["IN_TRANSIT"] = "in_transit";
    OrderStatus["ARRIVED_AT_DROPOFF"] = "arrived_at_dropoff";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CONFIRM_DELIVERY"] = "confirm_delivery";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["DISPUTED"] = "disputed";
    OrderStatus["EXPIRED"] = "expired";
    OrderStatus["NOT_REQUIRED"] = "not_required";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var TransactionDescription;
(function (TransactionDescription) {
    TransactionDescription["JOB_PAYMENT"] = "job payment";
    TransactionDescription["PRODUCT_PAYMENT"] = "product payment";
    TransactionDescription["PRODUCT_ORDER_PAYMENT"] = "product_order payment";
    TransactionDescription["WALLET_TOPUP"] = "wallet topup";
})(TransactionDescription || (exports.TransactionDescription = TransactionDescription = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["CAR"] = "car";
    VehicleType["BIKE"] = "bike";
    VehicleType["BUS"] = "bus";
    VehicleType["TRUCK"] = "truck";
    VehicleType["KEKE"] = "keke";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var RiderStatus;
(function (RiderStatus) {
    RiderStatus["BUSY"] = "busy";
    RiderStatus["AVAILABLE"] = "available";
    RiderStatus["SUSPENDED"] = "suspended";
    RiderStatus["INACTIVE"] = "inactive";
})(RiderStatus || (exports.RiderStatus = RiderStatus = {}));
var Accounts;
(function (Accounts) {
    Accounts["USER_WALLET"] = "user_wallet";
    Accounts["PLATFORM_ESCROW"] = "platform_escrow";
    Accounts["PLATFORM_REVENUE"] = "platform_revenue";
    Accounts["PAYMENT_GATEWAY"] = "payment_gateway";
    Accounts["PROFESSIONAL_WALLET"] = "professional_wallet";
})(Accounts || (exports.Accounts = Accounts = {}));
var CommissionType;
(function (CommissionType) {
    CommissionType["PERCENTAGE"] = "percentage";
    CommissionType["FIXED"] = "fixed";
})(CommissionType || (exports.CommissionType = CommissionType = {}));
var CommissionScope;
(function (CommissionScope) {
    CommissionScope["JOB"] = "job";
    CommissionScope["PRODUCT"] = "product";
    CommissionScope["DELIVERY"] = "delivery";
    CommissionScope["ALL"] = "all";
})(CommissionScope || (exports.CommissionScope = CommissionScope = {}));
var EntryCategory;
(function (EntryCategory) {
    EntryCategory["JOB"] = "job";
    EntryCategory["PRODUCT"] = "product";
    EntryCategory["DELIVERY"] = "delivery";
})(EntryCategory || (exports.EntryCategory = EntryCategory = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["JOB"] = "job";
    NotificationType["ORDER"] = "order";
    NotificationType["PAYMENT"] = "payment";
    NotificationType["CHAT"] = "chat";
    NotificationType["SYSTEM"] = "system";
    NotificationType["PROFILE"] = "profile";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
