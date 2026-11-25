"""Generate related, synthetic Excel workbooks for manual SheetMind testing."""

from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter

OUTPUT_DIR = Path(__file__).resolve().parents[2] / "test-data"

CUSTOMERS = [
    ("C01", "Alder Books", "North", "Retail"),
    ("C02", "Birch Studio", "South", "Business"),
    ("C03", "Cedar Cafe", "North", "Business"),
    ("C04", "Dune Market", "East", "Retail"),
    ("C05", "Elm Works", "West", "Business"),
    ("C06", "Fern Supply", "West", "Retail"),
]
PRODUCTS = [
    ("P01", "Notebook", "Stationery", 10),
    ("P02", "Pen Pack", "Stationery", 6),
    ("P03", "Desk Lamp", "Lighting", 35),
    ("P04", "Floor Lamp", "Lighting", 60),
    ("P05", "Travel Mug", "Kitchen", 14),
    ("P06", "Glass Bottle", "Kitchen", 18),
]
ORDERS = [
    ("O01", "C01", date(2026, 1, 4), "Shipped"),
    ("O02", "C02", date(2026, 1, 9), "Shipped"),
    ("O03", "C03", date(2026, 1, 20), "Shipped"),
    ("O04", "C04", date(2026, 2, 2), "Shipped"),
    ("O05", "C01", date(2026, 2, 13), "Shipped"),
    ("O06", "C05", date(2026, 2, 15), "Cancelled"),
    ("O07", "C06", date(2026, 3, 3), "Shipped"),
    ("O08", "C02", date(2026, 3, 17), "Pending"),
]
ORDER_LINES = [
    ("O01", "P01", 4),
    ("O01", "P02", 2),
    ("O02", "P03", 2),
    ("O02", "P05", 3),
    ("O03", "P02", 5),
    ("O03", "P06", 3),
    ("O04", "P04", 1),
    ("O04", "P01", 6),
    ("O05", "P03", 1),
    ("O05", "P05", 2),
    ("O06", "P04", 2),
    ("O07", "P06", 5),
    ("O07", "P01", 1),
    ("O08", "P02", 10),
]
RETURNS = [
    ("R01", "O01", "P01", date(2026, 1, 8), 1, 10, "Damaged"),
    ("R02", "O03", "P06", date(2026, 1, 25), 1, 18, "Changed mind"),
    ("R03", "O04", "P04", date(2026, 2, 11), 1, 60, "Defective"),
    ("R04", "O07", "P06", date(2026, 3, 5), 2, 36, "Damaged"),
]
WAREHOUSES = [("W01", "North"), ("W02", "South"), ("W03", "East"), ("W04", "West")]


def save_workbook(name, sheets):
    """Write distinctly named sheets with filters, frozen headers, and basic styling."""
    workbook = Workbook()
    workbook.remove(workbook.active)
    for title, columns, rows in sheets:
        sheet = workbook.create_sheet(title)
        sheet.append(columns)
        for row in rows:
            sheet.append(row)
        sheet.freeze_panes = "A2"
        sheet.auto_filter.ref = sheet.dimensions
        for cell in sheet[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill("solid", fgColor="1C4E63")
        for index, column in enumerate(columns, start=1):
            sheet.column_dimensions[get_column_letter(index)].width = max(17, len(column) + 4)
    path = OUTPUT_DIR / f"{name}.xlsx"
    workbook.save(path)
    return path


def generate() -> None:
    """Generate six workbooks plus a guide with independently calculated expectations."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    prices = {product_id: unit_price for product_id, _, _, unit_price in PRODUCTS}
    inventory = [
        (
            date(2026, 1, 1) + timedelta(days=day),
            warehouse_id,
            product_id,
            (day + warehouse_index * 3 + product_index * 5) % 41,
        )
        for day in range(30)
        for warehouse_index, (warehouse_id, _) in enumerate(WAREHOUSES)
        for product_index, (product_id, *_) in enumerate(PRODUCTS)
    ]
    files = [
        save_workbook(
            "Customers",
            [("Customers", ("customer_id", "customer_name", "region", "segment"), CUSTOMERS)],
        ),
        save_workbook(
            "Products",
            [
                ("Products", ("product_id", "product_name", "category", "unit_price"), PRODUCTS),
                (
                    "Categories",
                    ("category", "department"),
                    [
                        ("Stationery", "Office"),
                        ("Lighting", "Home"),
                        ("Kitchen", "Home"),
                    ],
                ),
            ],
        ),
        save_workbook(
            "Orders", [("Orders", ("order_id", "customer_id", "order_date", "status"), ORDERS)]
        ),
        save_workbook(
            "OrderLines",
            [
                (
                    "OrderLines",
                    ("order_id", "product_id", "quantity", "unit_price"),
                    [
                        (order, product, quantity, prices[product])
                        for order, product, quantity in ORDER_LINES
                    ],
                )
            ],
        ),
        save_workbook(
            "Returns",
            [
                (
                    "Returns",
                    (
                        "return_id",
                        "order_id",
                        "product_id",
                        "return_date",
                        "quantity",
                        "refund_amount",
                        "reason",
                    ),
                    RETURNS,
                )
            ],
        ),
        save_workbook(
            "Inventory",
            [
                (
                    "Inventory",
                    ("snapshot_date", "warehouse_id", "product_id", "on_hand"),
                    inventory,
                ),
                ("Warehouses", ("warehouse_id", "warehouse_region"), WAREHOUSES),
            ],
        ),
    ]
    write_guide(inventory)
    archive = OUTPUT_DIR / "SheetMind-test-data.zip"
    with ZipFile(archive, "w", compression=ZIP_DEFLATED) as bundle:
        for path in [*files, OUTPUT_DIR / "TEST_GUIDE.md"]:
            bundle.write(path, path.name)


def write_guide(inventory) -> None:
    """Describe join keys, expected answers, and workflows for manual verification."""
    shipped = {
        order: (customer, ordered)
        for order, customer, ordered, status in ORDERS
        if status == "Shipped"
    }
    regions = {customer: region for customer, _, region, _ in CUSTOMERS}
    prices = {product: price for product, _, _, price in PRODUCTS}
    regional_sales = defaultdict(int)
    monthly_sales = defaultdict(int)
    for order, product, quantity in ORDER_LINES:
        if order in shipped:
            customer, ordered = shipped[order]
            regional_sales[regions[customer]] += quantity * prices[product]
            monthly_sales[ordered.month] += quantity * prices[product]
    gross = sum(monthly_sales.values())
    refunds = sum(row[5] for row in RETURNS)
    low_stock = sum(
        snapshot == date(2026, 1, 30) and stock < 10 for snapshot, _, _, stock in inventory
    )
    guide = f"""# SheetMind desktop test data

Create a local profile named `SheetMindQA`. Upload the six .xlsx workbooks in Data Sources.
Use the file references offered by chat to select the named workbooks and sheets.
All records are synthetic and prices use USD.

| Workbook | Sheets and row counts |
| --- | --- |
| Customers | Customers {len(CUSTOMERS)} |
| Products | Products {len(PRODUCTS)}, Categories 3 |
| Orders | Orders {len(ORDERS)} |
| OrderLines | OrderLines {len(ORDER_LINES)} |
| Returns | Returns {len(RETURNS)} |
| Inventory | Inventory {len(inventory)}, Warehouses 4 |

Join Orders to Customers on customer_id and OrderLines to Orders on order_id.
Join Products to OrderLines, Inventory, and Returns on product_id.
Join Returns to OrderLines on both order_id and product_id.
Join Inventory to Warehouses on warehouse_id.

## Questions with expected results

1. Count orders by status. Expect Shipped 6, Cancelled 1, Pending 1.
2. Sum quantity multiplied by unit_price for shipped orders only. Expect ${gross}.
3. Show shipped revenue by customer region using Orders, OrderLines, and Customers.
   Expect {", ".join(f"{region} ${sales}" for region, sales in sorted(regional_sales.items()))}.
4. Show gross shipped sales, refunds, and net sales. Sum returns separately before subtracting.
   Expect ${gross} gross, ${refunds} refunded, and ${gross - refunds} net.
5. Plot monthly shipped sales as a bar chart. Expect Jan ${monthly_sales[1]}, Feb ${monthly_sales[2]}, Mar ${monthly_sales[3]}.
6. Count inventory records with on_hand below 10 on January 30, 2026. Expect {low_stock}.
7. Show all inventory snapshots sorted by snapshot_date, warehouse_id, product_id.
   Expect {len(inventory)} rows with no ties in the sort key.

## Workflow checks

- **Paging and export**. Set Result Row Limit to at least 720, ask question 7, move across several pages,
  and export the results. Check for 720 data rows. Switch the cap to 100 and verify it is enforced.
- **Excel edit and restore**. Open Products → Products. Ask to add 2 to unit_price for P01 and change
  no other cell. Preview the change from 10 to 12, apply it, reopen the workbook, and restore the
  previous history entry. Check that P01 returns to 10 and the header formatting remains.
- **Charts and dashboards**. Save the query from question 5. Add a dashboard widget using that saved
  query and verify the same three monthly totals in the widget and its chart.
- **Independent profiles**. Create a second local profile and confirm the six files and chats from
  SheetMindQA are absent. Switch back and confirm they remain available.
- **Provider validation**. Under Settings choose OpenAI-compatible, enter the API base URL, key and
  exact model ID, and use Test connection. Try a misspelled model ID, then restore the working model
  and save. Test a join and an edit using the saved settings.
- **Offline smoke test**. Disconnect the internet and open the editor, preview a workbook, and review
  saved results. For new AI questions while offline, configure a local Ollama model before disconnecting.
"""
    (OUTPUT_DIR / "TEST_GUIDE.md").write_text(guide, encoding="utf-8")


if __name__ == "__main__":
    generate()
