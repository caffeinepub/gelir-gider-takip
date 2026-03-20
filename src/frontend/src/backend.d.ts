import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Category {
    id: bigint;
    name: string;
}
export interface Account {
    id: bigint;
    name: string;
}
export interface Summary {
    balance: number;
    totalIncome: number;
    totalExpense: number;
}
export interface Transaction {
    id: bigint;
    transactionType: TransactionType;
    date: string;
    description: string;
    account: string;
    category: string;
    amount: number;
}
export enum TransactionType {
    expense = "expense",
    income = "income"
}
export interface backendInterface {
    addAccount(name: string): Promise<Account>;
    addCategory(name: string): Promise<Category>;
    addTransaction(date: string, description: string, category: string, account: string, amount: number, transactionType: TransactionType): Promise<Transaction>;
    deleteAccount(id: bigint): Promise<void>;
    deleteCategory(id: bigint): Promise<void>;
    deleteTransaction(id: bigint): Promise<void>;
    getAccounts(): Promise<Array<Account>>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getCategories(): Promise<Array<Category>>;
    getSummary(): Promise<Summary>;
    getTransaction(id: bigint): Promise<Transaction>;
    getTransactionsByMonth(month: string): Promise<Array<Transaction>>;
    initializeDefaults(): Promise<void>;
    updateTransaction(id: bigint, date: string, description: string, category: string, account: string, amount: number, transactionType: TransactionType): Promise<Transaction>;
}
