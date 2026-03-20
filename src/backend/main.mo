import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";



actor {
  // Type Definitions
  type TransactionType = {
    #income;
    #expense;
  };

  type Transaction = {
    id : Nat;
    date : Text;
    description : Text;
    category : Text;
    account : Text;
    amount : Float;
    transactionType : TransactionType;
  };

  type Category = {
    id : Nat;
    name : Text;
  };

  type Account = {
    id : Nat;
    name : Text;
  };

  type Summary = {
    totalIncome : Float;
    totalExpense : Float;
    balance : Float;
  };

  // State Variables
  var transactionIdCounter = 0;
  var categoryIdCounter = 0;
  var accountIdCounter = 0;

  let transactions = Map.empty<Nat, Transaction>();
  let categories = Map.empty<Nat, Category>();
  let accounts = Map.empty<Nat, Account>();

  // Default Categories and Accounts
  let defaultCategories = [
    "Maa\u{015F}",
    "Kira",
    "Market",
    "Fatura",
    "Ula\u{015F}ım",
    "E\u{011F}lence",
    "Sa\u{011F}lık",
    "Di\u{011F}er",
  ];

  let defaultAccounts = [
    "Banka",
    "Nakit",
    "Kredi Kartı",
  ];

  // CATEGORY MANAGEMENT
  public shared ({ caller }) func addCategory(name : Text) : async Category {
    // Check if category already exists (case-insensitive)
    let exists = categories.values().any(
      func(category) {
        category.name.toLower() == name.toLower();
      }
    );

    if (exists) {
      Runtime.trap("Category already exists");
    };

    let newCategory = {
      id = categoryIdCounter;
      name;
    };

    categories.add(categoryIdCounter, newCategory);
    categoryIdCounter += 1;
    newCategory;
  };

  public query ({ caller }) func getCategories() : async [Category] {
    categories.values().toArray();
  };

  public shared ({ caller }) func deleteCategory(id : Nat) : async () {
    // Prevent deletion of default categories
    let isDefault = categories.values().any(
      func(category) {
        category.id == id and defaultCategories.any(func(default) { default == category.name });
      }
    );

    if (isDefault) {
      Runtime.trap("Cannot delete default category");
    };

    categories.remove(id);
  };

  // ACCOUNT MANAGEMENT
  public shared ({ caller }) func addAccount(name : Text) : async Account {
    // Check if account already exists (case-insensitive)
    let exists = accounts.values().any(
      func(account) {
        account.name.toLower() == name.toLower();
      }
    );

    if (exists) {
      Runtime.trap("Account already exists");
    };

    let newAccount = {
      id = accountIdCounter;
      name;
    };

    accounts.add(accountIdCounter, newAccount);
    accountIdCounter += 1;
    newAccount;
  };

  public query ({ caller }) func getAccounts() : async [Account] {
    accounts.values().toArray();
  };

  public shared ({ caller }) func deleteAccount(id : Nat) : async () {
    // Prevent deletion of default accounts
    let isDefault = accounts.values().any(
      func(account) {
        account.id == id and defaultAccounts.any(func(default) { default == account.name });
      }
    );

    if (isDefault) {
      Runtime.trap("Cannot delete default account");
    };

    accounts.remove(id);
  };

  // TRANSACTION MANAGEMENT
  public shared ({ caller }) func addTransaction(
    date : Text,
    description : Text,
    category : Text,
    account : Text,
    amount : Float,
    transactionType : TransactionType,
  ) : async Transaction {
    let newTransaction = {
      id = transactionIdCounter;
      date;
      description;
      category;
      account;
      amount;
      transactionType;
    };

    transactions.add(transactionIdCounter, newTransaction);
    transactionIdCounter += 1;
    newTransaction;
  };

  public shared ({ caller }) func updateTransaction(
    id : Nat,
    date : Text,
    description : Text,
    category : Text,
    account : Text,
    amount : Float,
    transactionType : TransactionType,
  ) : async Transaction {
    switch (transactions.get(id)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?_) {
        let updatedTransaction = {
          id;
          date;
          description;
          category;
          account;
          amount;
          transactionType;
        };

        transactions.add(id, updatedTransaction);
        updatedTransaction;
      };
    };
  };

  public shared ({ caller }) func deleteTransaction(id : Nat) : async () {
    transactions.remove(id);
  };

  public query ({ caller }) func getTransaction(id : Nat) : async Transaction {
    switch (transactions.get(id)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?transaction) { transaction };
    };
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    transactions.values().toArray();
  };

  // SUMMARY
  public query ({ caller }) func getSummary() : async Summary {
    var totalIncome : Float = 0;
    var totalExpense : Float = 0;

    transactions.values().forEach(
      func(transaction) {
        switch (transaction.transactionType) {
          case (#income) { totalIncome += transaction.amount };
          case (#expense) { totalExpense += transaction.amount };
        };
      }
    );

    {
      totalIncome;
      totalExpense;
      balance = totalIncome - totalExpense;
    };
  };

  // FILTERED TRANSACTIONS
  public query ({ caller }) func getTransactionsByMonth(month : Text) : async [Transaction] {
    let filtered = transactions.values().toArray().filter(
      func(transaction) {
        transaction.date.contains(#text(month));
      }
    );
    filtered;
  };

  // MIGRATION - Initialize default categories and accounts
  public func initializeDefaults() : async () {
    for (category in defaultCategories.values()) {
      let newCategory = {
        id = categoryIdCounter;
        name = category;
      };
      categories.add(categoryIdCounter, newCategory);
      categoryIdCounter += 1;
    };

    for (account in defaultAccounts.values()) {
      let newAccount = {
        id = accountIdCounter;
        name = account;
      };
      accounts.add(accountIdCounter, newAccount);
      accountIdCounter += 1;
    };
  };
};
