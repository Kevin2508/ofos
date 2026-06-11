export interface CreateRefundDto {
    orderId: number;
    reason: string;
}
export interface GetAllRefundsDto {
    page: number;
    limit: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
}