import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

# ------------------- Configuration -------------------
START_DATE = datetime(2023, 1, 1)
np.random.seed(42)
os.makedirs("relational_excels", exist_ok=True)

def random_dates(n, start=START_DATE, days=730):
    return [start + timedelta(days=int(d)) for d in np.random.randint(0, days, n)]

# ========================================================
# GLOBAL MASTER DATA (shared across all files)
# ========================================================

# 200 Customers — same IDs used in all files
N_CUSTOMERS = 200
CUSTOMER_IDS = list(range(1001, 1001 + N_CUSTOMERS))
countries = ['India', 'USA', 'UK', 'Germany', 'Australia', 'Canada', 'Singapore']
cities    = ['Ahmedabad', 'Mumbai', 'Delhi', 'New York', 'London', 'Berlin', 'Sydney']
CUSTOMERS_MASTER = pd.DataFrame({
    'CustomerID':   CUSTOMER_IDS,
    'CustomerName': [f"Customer_{i}" for i in range(N_CUSTOMERS)],
    'Country':      np.random.choice(countries, N_CUSTOMERS),
    'City':         np.random.choice(cities,    N_CUSTOMERS),
    'JoinDate':     random_dates(N_CUSTOMERS),
    'Segment':      np.random.choice(['Retail', 'Corporate', 'SMB'], N_CUSTOMERS),
    'Email':        [f"customer_{i}@email.com" for i in range(N_CUSTOMERS)],
    'Phone':        [f"+91-{np.random.randint(70000000,99999999)}" for _ in range(N_CUSTOMERS)],
})

# 100 Products — same IDs used in all files
N_PRODUCTS = 100
PRODUCT_IDS = list(range(5001, 5001 + N_PRODUCTS))
categories = ['Electronics', 'Furniture', 'Office Supplies', 'Appliances', 'Clothing']
subcats    = ['Laptop', 'Chair', 'Pen', 'Refrigerator', 'T-Shirt', 'Phone', 'Desk', 'Notebook', 'Tablet', 'Lamp']
unit_prices = np.round(np.random.uniform(10, 1500, N_PRODUCTS), 2)
cost_prices = np.round(unit_prices * np.random.uniform(0.4, 0.75, N_PRODUCTS), 2)
PRODUCTS_MASTER = pd.DataFrame({
    'ProductID':    PRODUCT_IDS,
    'ProductName':  [f"Prod_{i}" for i in range(N_PRODUCTS)],
    'Category':     np.random.choice(categories, N_PRODUCTS),
    'SubCategory':  np.random.choice(subcats,    N_PRODUCTS),
    'UnitPrice':    unit_prices,
    'CostPrice':    cost_prices,
    'ProfitMargin': np.round((unit_prices - cost_prices) / unit_prices * 100, 1),
    'Brand':        np.random.choice(['BrandA','BrandB','BrandC','BrandD','BrandE'], N_PRODUCTS),
    'SKU':          [f"SKU-{5001+i}" for i in range(N_PRODUCTS)],
})

# 50 Employees — same IDs used in all files
N_EMP = 50
EMP_IDS = list(range(2001, 2001 + N_EMP))
departments = ['Sales', 'Support', 'Logistics', 'Marketing', 'Finance']
EMPLOYEES_MASTER = pd.DataFrame({
    'EmployeeID':   EMP_IDS,
    'EmployeeName': [f"Emp_{i}" for i in range(N_EMP)],
    'Department':   np.random.choice(departments, N_EMP),
    'Role':         np.random.choice(['Manager','Executive','Analyst','Associate'], N_EMP),
    'HireDate':     random_dates(N_EMP),
    'Salary':       np.round(np.random.uniform(30000, 120000, N_EMP), 2),
    'Region':       np.random.choice(['North','South','East','West','Central'], N_EMP),
})

# 10 Suppliers — referenced in procurement file
SUPPLIER_IDS = list(range(3001, 3011))
SUPPLIERS_MASTER = pd.DataFrame({
    'SupplierID':   SUPPLIER_IDS,
    'SupplierName': [f"Supplier_{i}" for i in range(10)],
    'Country':      np.random.choice(countries, 10),
    'ContactEmail': [f"supplier_{i}@vendor.com" for i in range(10)],
    'Rating':       np.round(np.random.uniform(3.0, 5.0, 10), 1),
    'PaymentTerms': np.random.choice(['Net30','Net60','Immediate'], 10),
})

# 5 Warehouses — referenced in inventory/logistics
WAREHOUSE_IDS = ['WH001','WH002','WH003','WH004','WH005']
WAREHOUSES_MASTER = pd.DataFrame({
    'WarehouseID':   WAREHOUSE_IDS,
    'WarehouseName': ['WH_Ahmedabad','WH_Mumbai','WH_Delhi','WH_Bangalore','WH_Chennai'],
    'City':          ['Ahmedabad','Mumbai','Delhi','Bangalore','Chennai'],
    'Capacity':      [10000, 15000, 12000, 8000, 9000],
    'ManagerID':     np.random.choice(EMP_IDS, 5),
})

# ========================================================
# FILE 1 — Master_Reference.xlsx
# Contains all master dimension tables
# ========================================================
with pd.ExcelWriter("relational_excels/01_Master_Reference.xlsx", engine='openpyxl') as w:
    CUSTOMERS_MASTER.to_excel(w, sheet_name='Customers',  index=False)
    PRODUCTS_MASTER.to_excel(w,  sheet_name='Products',   index=False)
    EMPLOYEES_MASTER.to_excel(w, sheet_name='Employees',  index=False)
    SUPPLIERS_MASTER.to_excel(w, sheet_name='Suppliers',  index=False)
    WAREHOUSES_MASTER[['WarehouseID','WarehouseName','City','Capacity','ManagerID']]\
        .to_excel(w, sheet_name='Warehouses', index=False)
print("Created: 01_Master_Reference.xlsx")

# ========================================================
# FILE 2 — Sales_Orders.xlsx
# Core order header table; CustomerID + EmployeeID FKs
# ========================================================
N_ORDERS = 1200
order_ids = list(range(10001, 10001 + N_ORDERS))
ORDERS = pd.DataFrame({
    'OrderID':      order_ids,
    'CustomerID':   np.random.choice(CUSTOMER_IDS,  N_ORDERS),
    'EmployeeID':   np.random.choice(EMP_IDS,       N_ORDERS),
    'OrderDate':    random_dates(N_ORDERS),
    'Region':       np.random.choice(['North','South','East','West','Central'], N_ORDERS),
    'ShipMode':     np.random.choice(['Standard','Express','Same Day'], N_ORDERS),
    'Status':       np.random.choice(['Delivered','Pending','Cancelled','Returned'], N_ORDERS,
                                     p=[0.70, 0.15, 0.08, 0.07]),
    'Channel':      np.random.choice(['Online','In-Store','Partner'], N_ORDERS),
})

# Summary sheet
order_summary = ORDERS.groupby(['Region','Status']).size().reset_index(name='OrderCount')

with pd.ExcelWriter("relational_excels/02_Sales_Orders.xlsx", engine='openpyxl') as w:
    ORDERS.to_excel(w, sheet_name='Orders', index=False)
    order_summary.to_excel(w, sheet_name='OrderSummary', index=False)
    # Slim customer lookup
    CUSTOMERS_MASTER[['CustomerID','CustomerName','Segment','Country']]\
        .to_excel(w, sheet_name='CustomerLookup', index=False)
print("Created: 02_Sales_Orders.xlsx")

# ========================================================
# FILE 3 — Order_Details.xlsx
# Line-item detail; OrderID + ProductID FKs
# ========================================================
N_OD = 3000
OD_ORDER_IDS = np.random.choice(order_ids, N_OD)
OD_PROD_IDS  = np.random.choice(PRODUCT_IDS, N_OD)
quantities   = np.random.randint(1, 20, N_OD)
discounts    = np.round(np.random.uniform(0, 0.30, N_OD), 2)

price_map = dict(zip(PRODUCTS_MASTER['ProductID'], PRODUCTS_MASTER['UnitPrice']))
cost_map  = dict(zip(PRODUCTS_MASTER['ProductID'], PRODUCTS_MASTER['CostPrice']))
unit_p    = np.array([price_map[p] for p in OD_PROD_IDS])
cost_p    = np.array([cost_map[p]  for p in OD_PROD_IDS])
sales_amt = np.round(quantities * unit_p * (1 - discounts), 2)
profit_amt= np.round(quantities * (unit_p - cost_p) * (1 - discounts), 2)

ORDER_DETAILS = pd.DataFrame({
    'OrderDetailID': range(1, N_OD + 1),
    'OrderID':       OD_ORDER_IDS,
    'ProductID':     OD_PROD_IDS,
    'Quantity':      quantities,
    'UnitPrice':     unit_p,
    'Discount':      discounts,
    'Sales':         sales_amt,
    'Profit':        profit_amt,
})

# Product-level sales rollup
prod_rollup = ORDER_DETAILS.groupby('ProductID').agg(
    TotalSales=('Sales','sum'), TotalProfit=('Profit','sum'), OrderCount=('OrderID','nunique')
).reset_index().round(2)

with pd.ExcelWriter("relational_excels/03_Order_Details.xlsx", engine='openpyxl') as w:
    ORDER_DETAILS.to_excel(w, sheet_name='OrderDetails', index=False)
    prod_rollup.to_excel(w,   sheet_name='ProductRollup', index=False)
    PRODUCTS_MASTER[['ProductID','ProductName','Category','UnitPrice','CostPrice']]\
        .to_excel(w, sheet_name='ProductLookup', index=False)
print("Created: 03_Order_Details.xlsx")

# ========================================================
# FILE 4 — Customer_Analytics.xlsx
# Customer KPIs derived from orders + details
# ========================================================
cust_orders = ORDERS.merge(ORDER_DETAILS, on='OrderID')
cust_kpi = cust_orders.groupby('CustomerID').agg(
    TotalOrders=('OrderID','nunique'),
    TotalSpend=('Sales','sum'),
    TotalProfit=('Profit','sum'),
    AvgOrderValue=('Sales','mean'),
    LastOrderDate=('OrderDate','max'),
).reset_index().pipe(lambda df: df.assign(**df.select_dtypes(include='number').round(2)))
cust_kpi = cust_kpi.merge(CUSTOMERS_MASTER[['CustomerID','CustomerName','Segment','Country','City']], on='CustomerID')

# Segment summary
seg_summary = cust_kpi.groupby('Segment').agg(
    Customers=('CustomerID','count'),
    AvgSpend=('TotalSpend','mean'),
    TotalRevenue=('TotalSpend','sum'),
).reset_index().round(2)

# Country summary
country_summary = cust_kpi.groupby('Country').agg(
    Customers=('CustomerID','count'),
    TotalRevenue=('TotalSpend','sum'),
    AvgOrderValue=('AvgOrderValue','mean'),
).reset_index().round(2)

with pd.ExcelWriter("relational_excels/04_Customer_Analytics.xlsx", engine='openpyxl') as w:
    cust_kpi.to_excel(w,       sheet_name='CustomerKPIs',    index=False)
    seg_summary.to_excel(w,    sheet_name='SegmentSummary',  index=False)
    country_summary.to_excel(w,sheet_name='CountrySummary',  index=False)
    CUSTOMERS_MASTER.to_excel(w, sheet_name='CustomerMaster', index=False)
print("Created: 04_Customer_Analytics.xlsx")

# ========================================================
# FILE 5 — Inventory_Management.xlsx
# Stock per product per warehouse; ProductID + WarehouseID FKs
# ========================================================
N_INV = 300
inv_prod = np.random.choice(PRODUCT_IDS,  N_INV)
inv_wh   = np.random.choice(WAREHOUSE_IDS, N_INV)
stock_qty = np.random.randint(0, 500, N_INV)
reorder   = np.random.randint(20, 100, N_INV)

INVENTORY = pd.DataFrame({
    'InventoryID':     range(1, N_INV + 1),
    'ProductID':       inv_prod,
    'WarehouseID':     inv_wh,
    'StockQuantity':   stock_qty,
    'ReorderLevel':    reorder,
    'NeedsReorder':    (stock_qty < reorder),
    'LastRestockDate': random_dates(N_INV),
    'UnitCost':        np.array([cost_map[p] for p in inv_prod]),
    'StockValue':      np.round(stock_qty * np.array([cost_map[p] for p in inv_prod]), 2),
})

low_stock = INVENTORY[INVENTORY['NeedsReorder'] == True]\
    .merge(PRODUCTS_MASTER[['ProductID','ProductName','Category']], on='ProductID')

wh_summary = INVENTORY.groupby('WarehouseID').agg(
    Products=('ProductID','nunique'),
    TotalStock=('StockQuantity','sum'),
    StockValue=('StockValue','sum'),
    LowStockItems=('NeedsReorder','sum'),
).reset_index().round(2)

with pd.ExcelWriter("relational_excels/05_Inventory_Management.xlsx", engine='openpyxl') as w:
    INVENTORY.to_excel(w,   sheet_name='Inventory',        index=False)
    low_stock.to_excel(w,   sheet_name='LowStockAlerts',   index=False)
    wh_summary.to_excel(w,  sheet_name='WarehouseSummary', index=False)
    WAREHOUSES_MASTER.to_excel(w, sheet_name='Warehouses', index=False)
print("Created: 05_Inventory_Management.xlsx")

# ========================================================
# FILE 6 — Employee_Performance.xlsx
# Sales per employee; EmployeeID FK
# ========================================================
emp_sales = ORDERS.merge(ORDER_DETAILS, on='OrderID')\
    .groupby('EmployeeID').agg(
        OrdersHandled=('OrderID','nunique'),
        TotalSales=('Sales','sum'),
        TotalProfit=('Profit','sum'),
        AvgDealSize=('Sales','mean'),
    ).reset_index().round(2)
emp_perf = emp_sales.merge(EMPLOYEES_MASTER, on='EmployeeID')
emp_perf['AttainmentPct'] = np.round(
    emp_perf['TotalSales'] / emp_perf['TotalSales'].max() * 100, 1)

dept_summary = emp_perf.groupby('Department').agg(
    Headcount=('EmployeeID','count'),
    TotalSales=('TotalSales','sum'),
    AvgSalary=('Salary','mean'),
).reset_index().round(2)

with pd.ExcelWriter("relational_excels/06_Employee_Performance.xlsx", engine='openpyxl') as w:
    emp_perf.to_excel(w,    sheet_name='EmployeePerformance', index=False)
    dept_summary.to_excel(w,sheet_name='DeptSummary',         index=False)
    EMPLOYEES_MASTER.to_excel(w, sheet_name='EmployeeMaster', index=False)
print("Created: 06_Employee_Performance.xlsx")

# ========================================================
# FILE 7 — Returns_Refunds.xlsx
# Cancelled/Returned orders; OrderID FK
# ========================================================
returned_orders = ORDERS[ORDERS['Status'].isin(['Cancelled','Returned'])].copy()
N_RET = len(returned_orders)
RETURNS = returned_orders[['OrderID','CustomerID','OrderDate','Status','Region']].copy()
RETURNS['ReturnDate'] = [d + timedelta(days=int(x))
                         for d, x in zip(RETURNS['OrderDate'], np.random.randint(3, 30, N_RET))]
RETURNS['RefundAmount'] = np.round(np.random.uniform(100, 3000, N_RET), 2)
RETURNS['ReturnReason'] = np.random.choice(
    ['Defective','Wrong Item','Not as Described','Changed Mind','Damaged in Transit'], N_RET)
RETURNS['ResolutionStatus'] = np.random.choice(['Refunded','Pending','Rejected'], N_RET,
                                                p=[0.65, 0.25, 0.10])

reason_summary = RETURNS.groupby('ReturnReason').agg(
    Count=('OrderID','count'),
    TotalRefund=('RefundAmount','sum'),
).reset_index().round(2)

with pd.ExcelWriter("relational_excels/07_Returns_Refunds.xlsx", engine='openpyxl') as w:
    RETURNS.to_excel(w,        sheet_name='Returns',       index=False)
    reason_summary.to_excel(w, sheet_name='ReasonSummary', index=False)
    CUSTOMERS_MASTER[['CustomerID','CustomerName','Country','Segment']]\
        .to_excel(w, sheet_name='CustomerLookup', index=False)
print("Created: 07_Returns_Refunds.xlsx")

# ========================================================
# FILE 8 — Procurement.xlsx
# Purchase orders from suppliers; ProductID + SupplierID FKs
# ========================================================
N_PO = 400
po_prod = np.random.choice(PRODUCT_IDS, N_PO)
PROCUREMENT = pd.DataFrame({
    'POID':         range(7001, 7001 + N_PO),
    'SupplierID':   np.random.choice(SUPPLIER_IDS, N_PO),
    'ProductID':    po_prod,
    'WarehouseID':  np.random.choice(WAREHOUSE_IDS, N_PO),
    'OrderQty':     np.random.randint(50, 500, N_PO),
    'UnitCost':     np.array([cost_map[p] for p in po_prod]),
    'OrderDate':    random_dates(N_PO),
    'ExpectedDate': [d + timedelta(days=int(x))
                     for d, x in zip(random_dates(N_PO), np.random.randint(7, 45, N_PO))],
    'Status':       np.random.choice(['Received','In-Transit','Ordered','Delayed'], N_PO,
                                     p=[0.55, 0.20, 0.15, 0.10]),
})
PROCUREMENT['TotalCost'] = np.round(PROCUREMENT['OrderQty'] * PROCUREMENT['UnitCost'], 2)

supplier_summary = PROCUREMENT.groupby('SupplierID').agg(
    Orders=('POID','count'),
    TotalSpend=('TotalCost','sum'),
    AvgDeliveryDelay=('OrderQty','mean'),
).reset_index().round(2)

with pd.ExcelWriter("relational_excels/08_Procurement.xlsx", engine='openpyxl') as w:
    PROCUREMENT.to_excel(w,       sheet_name='PurchaseOrders',   index=False)
    supplier_summary.to_excel(w,  sheet_name='SupplierSummary',  index=False)
    SUPPLIERS_MASTER.to_excel(w,  sheet_name='SupplierMaster',   index=False)
    PRODUCTS_MASTER[['ProductID','ProductName','Category','CostPrice']]\
        .to_excel(w, sheet_name='ProductLookup', index=False)
print("Created: 08_Procurement.xlsx")

# ========================================================
# FILE 9 — Finance_Revenue.xlsx
# Monthly revenue/profit aggregations; cross-ref with orders
# ========================================================
fin_df = ORDERS.merge(ORDER_DETAILS, on='OrderID').copy()
fin_df['Month']  = pd.to_datetime(fin_df['OrderDate']).dt.to_period('M').astype(str)
fin_df['Quarter']= pd.to_datetime(fin_df['OrderDate']).dt.to_period('Q').astype(str)

monthly = fin_df.groupby('Month').agg(
    Revenue=('Sales','sum'), Profit=('Profit','sum'),
    Orders=('OrderID','nunique'), Customers=('CustomerID','nunique')
).reset_index().round(2)
monthly['ProfitMarginPct'] = np.round(monthly['Profit'] / monthly['Revenue'] * 100, 1)

quarterly = fin_df.groupby('Quarter').agg(
    Revenue=('Sales','sum'), Profit=('Profit','sum'),
    Orders=('OrderID','nunique'),
).reset_index().round(2)

regional_rev = fin_df.groupby('Region').agg(
    Revenue=('Sales','sum'), Profit=('Profit','sum'),
    Orders=('OrderID','nunique'),
).reset_index().round(2)

category_rev = fin_df.merge(PRODUCTS_MASTER[['ProductID','Category']], on='ProductID')\
    .groupby('Category').agg(Revenue=('Sales','sum'), Profit=('Profit','sum')).reset_index().round(2)

with pd.ExcelWriter("relational_excels/09_Finance_Revenue.xlsx", engine='openpyxl') as w:
    monthly.to_excel(w,      sheet_name='MonthlyRevenue',   index=False)
    quarterly.to_excel(w,    sheet_name='QuarterlyRevenue', index=False)
    regional_rev.to_excel(w, sheet_name='RegionalRevenue',  index=False)
    category_rev.to_excel(w, sheet_name='CategoryRevenue',  index=False)
print("Created: 09_Finance_Revenue.xlsx")

# ========================================================
# FILE 10 — Logistics_Shipments.xlsx
# Shipment records per order; OrderID + WarehouseID FKs
# ========================================================
delivered = ORDERS[ORDERS['Status'] == 'Delivered'].copy()
N_SHIP = len(delivered)
ship_dates = [d + timedelta(days=int(x))
              for d, x in zip(delivered['OrderDate'], np.random.randint(1, 5, N_SHIP))]
delivery_dates = [s + timedelta(days=int(x))
                  for s, x in zip(ship_dates, np.random.randint(1, 14, N_SHIP))]

SHIPMENTS = pd.DataFrame({
    'ShipmentID':     range(8001, 8001 + N_SHIP),
    'OrderID':        delivered['OrderID'].values,
    'CustomerID':     delivered['CustomerID'].values,
    'WarehouseID':    np.random.choice(WAREHOUSE_IDS, N_SHIP),
    'ShipDate':       ship_dates,
    'DeliveryDate':   delivery_dates,
    'Carrier':        np.random.choice(['FedEx','DHL','UPS','BlueDart','India Post'], N_SHIP),
    'ShipMode':       delivered['ShipMode'].values,
    'DeliveryDays':   [(d - s).days for d, s in zip(delivery_dates, ship_dates)],
    'ShippingCost':   np.round(np.random.uniform(20, 500, N_SHIP), 2),
    'DeliveryStatus': np.random.choice(['On Time','Late','Early'], N_SHIP, p=[0.65,0.25,0.10]),
})

carrier_summary = SHIPMENTS.groupby('Carrier').agg(
    Shipments=('ShipmentID','count'),
    AvgDeliveryDays=('DeliveryDays','mean'),
    TotalShippingCost=('ShippingCost','sum'),
    OnTimePct=('DeliveryStatus', lambda x: (x=='On Time').mean()*100)
).reset_index().round(2)

with pd.ExcelWriter("relational_excels/10_Logistics_Shipments.xlsx", engine='openpyxl') as w:
    SHIPMENTS.to_excel(w,       sheet_name='Shipments',      index=False)
    carrier_summary.to_excel(w, sheet_name='CarrierSummary', index=False)
    WAREHOUSES_MASTER.to_excel(w, sheet_name='Warehouses',   index=False)
print("Created: 10_Logistics_Shipments.xlsx")

# ========================================================
# FILE 11 — Marketing_Campaigns.xlsx
# Campaign spend vs revenue attributed; CustomerID FK
# ========================================================
N_CAMP = 20
campaign_ids = list(range(9001, 9001 + N_CAMP))
CAMPAIGNS = pd.DataFrame({
    'CampaignID':   campaign_ids,
    'CampaignName': [f"Campaign_{chr(65+i%26)}_{i}" for i in range(N_CAMP)],
    'Channel':      np.random.choice(['Email','Social','Search','Display','Affiliate'], N_CAMP),
    'StartDate':    random_dates(N_CAMP),
    'Budget':       np.round(np.random.uniform(5000, 50000, N_CAMP), 2),
    'Spend':        np.round(np.random.uniform(3000, 48000, N_CAMP), 2),
    'TargetSegment':np.random.choice(['Retail','Corporate','SMB','All'], N_CAMP),
    'Region':       np.random.choice(['North','South','East','West','Central','All'], N_CAMP),
})
CAMPAIGNS['ROI_Pct'] = np.round(np.random.uniform(-10, 150, N_CAMP), 1)

# Customer-campaign attribution
N_ATTR = 600
ATTRIBUTION = pd.DataFrame({
    'AttributionID': range(1, N_ATTR+1),
    'CampaignID':    np.random.choice(campaign_ids, N_ATTR),
    'CustomerID':    np.random.choice(CUSTOMER_IDS, N_ATTR),
    'OrderID':       np.random.choice(order_ids, N_ATTR),
    'RevenueAttributed': np.round(np.random.uniform(100, 5000, N_ATTR), 2),
    'AttributionDate':   random_dates(N_ATTR),
})

channel_summary = CAMPAIGNS.groupby('Channel').agg(
    Campaigns=('CampaignID','count'),
    TotalBudget=('Budget','sum'),
    TotalSpend=('Spend','sum'),
    AvgROI=('ROI_Pct','mean'),
).reset_index().round(2)

with pd.ExcelWriter("relational_excels/11_Marketing_Campaigns.xlsx", engine='openpyxl') as w:
    CAMPAIGNS.to_excel(w,       sheet_name='Campaigns',      index=False)
    ATTRIBUTION.to_excel(w,     sheet_name='Attribution',    index=False)
    channel_summary.to_excel(w, sheet_name='ChannelSummary', index=False)
print("Created: 11_Marketing_Campaigns.xlsx")

# ========================================================
# FILE 12 — Customer_Support.xlsx
# Support tickets; CustomerID + OrderID + EmployeeID FKs
# ========================================================
N_TKT = 500
TICKETS = pd.DataFrame({
    'TicketID':       range(6001, 6001 + N_TKT),
    'CustomerID':     np.random.choice(CUSTOMER_IDS, N_TKT),
    'OrderID':        np.random.choice(order_ids, N_TKT),
    'AssignedEmpID':  np.random.choice(EMP_IDS, N_TKT),
    'OpenDate':       random_dates(N_TKT),
    'Category':       np.random.choice(['Delivery','Product','Billing','Returns','General'], N_TKT),
    'Priority':       np.random.choice(['Low','Medium','High','Critical'], N_TKT, p=[0.3,0.4,0.2,0.1]),
    'Status':         np.random.choice(['Open','In Progress','Resolved','Closed'], N_TKT, p=[0.1,0.2,0.4,0.3]),
    'SatisfactionScore': np.random.choice([1,2,3,4,5], N_TKT, p=[0.05,0.10,0.20,0.35,0.30]),
    'ResolutionDays': np.random.randint(0, 30, N_TKT),
})

cat_summary = TICKETS.groupby('Category').agg(
    Tickets=('TicketID','count'),
    AvgResolutionDays=('ResolutionDays','mean'),
    AvgSatisfaction=('SatisfactionScore','mean'),
    OpenCount=('Status', lambda x: (x=='Open').sum()),
).reset_index().round(2)

with pd.ExcelWriter("relational_excels/12_Customer_Support.xlsx", engine='openpyxl') as w:
    TICKETS.to_excel(w,      sheet_name='SupportTickets', index=False)
    cat_summary.to_excel(w,  sheet_name='CategorySummary',index=False)
    CUSTOMERS_MASTER[['CustomerID','CustomerName','Segment']]\
        .to_excel(w, sheet_name='CustomerLookup', index=False)
    EMPLOYEES_MASTER[['EmployeeID','EmployeeName','Department']]\
        .to_excel(w, sheet_name='EmployeeLookup', index=False)
print("Created: 12_Customer_Support.xlsx")

# ========================================================
# FILE 13 — Executive_Dashboard.xlsx
# High-level KPIs cross-referencing all domains
# ========================================================
total_revenue  = ORDER_DETAILS['Sales'].sum()
total_profit   = ORDER_DETAILS['Profit'].sum()
total_orders   = ORDERS['OrderID'].nunique()
total_customers= ORDERS['CustomerID'].nunique()
total_products = ORDER_DETAILS['ProductID'].nunique()
return_rate    = len(RETURNS) / total_orders * 100

kpi_df = pd.DataFrame({
    'KPI': ['Total Revenue','Total Profit','Profit Margin %','Total Orders',
            'Active Customers','Products Sold','Return Rate %',
            'Avg Order Value','Total Employees','Total Suppliers'],
    'Value': [
        round(total_revenue, 2),
        round(total_profit, 2),
        round(total_profit / total_revenue * 100, 1),
        total_orders,
        total_customers,
        total_products,
        round(return_rate, 2),
        round(total_revenue / total_orders, 2),
        N_EMP,
        len(SUPPLIER_IDS),
    ]
})

top_products = ORDER_DETAILS.merge(PRODUCTS_MASTER[['ProductID','ProductName','Category']], on='ProductID')\
    .groupby(['ProductID','ProductName','Category'])\
    .agg(Revenue=('Sales','sum'), Profit=('Profit','sum'), Qty=('Quantity','sum'))\
    .reset_index().sort_values('Revenue', ascending=False).head(20).round(2)

top_customers = cust_kpi.sort_values('TotalSpend', ascending=False).head(20)\
    [['CustomerID','CustomerName','Country','Segment','TotalSpend','TotalOrders']].round(2)

region_kpi = ORDERS.merge(ORDER_DETAILS, on='OrderID')\
    .groupby('Region').agg(
        Revenue=('Sales','sum'), Profit=('Profit','sum'),
        Orders=('OrderID','nunique'), Customers=('CustomerID','nunique')
    ).reset_index().round(2)

with pd.ExcelWriter("relational_excels/13_Executive_Dashboard.xlsx", engine='openpyxl') as w:
    kpi_df.to_excel(w,        sheet_name='KeyMetrics',    index=False)
    top_products.to_excel(w,  sheet_name='TopProducts',   index=False)
    top_customers.to_excel(w, sheet_name='TopCustomers',  index=False)
    region_kpi.to_excel(w,    sheet_name='RegionKPIs',    index=False)
    monthly.to_excel(w,       sheet_name='MonthlyTrend',  index=False)
print("Created: 13_Executive_Dashboard.xlsx")

print(f"\n✅ Done! 13 Excel files in 'relational_excels/'")
print("\n--- RELATIONSHIP MAP ---")
print("CustomerID  : Files 01,02,04,07,11,12  (200 shared IDs)")
print("ProductID   : Files 01,03,05,08,13      (100 shared IDs)")
print("EmployeeID  : Files 01,06,12            (50  shared IDs)")
print("SupplierID  : Files 01,08              (10  shared IDs)")
print("WarehouseID : Files 01,05,08,10        (5   shared IDs)")
print("OrderID     : Files 02,03,07,10,11,12  (1200 shared IDs)")
