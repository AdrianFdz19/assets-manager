
export interface DashboardStats {
    total_value: number;
    asset_count: number;
    category_count: number;
    top_asset_name: string;
    category_distribution: any; //Definir mejor el tipo
    status_distribution?: any; //Definir mejor el tipo
}