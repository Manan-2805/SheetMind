import io
from typing import Any, Dict, List, Optional

import matplotlib
import matplotlib.colors as mcolors
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

matplotlib.use("Agg")

sns.set_theme(style="whitegrid")
plt.rcParams["figure.figsize"] = [10, 6]
plt.rcParams["font.size"] = 12


def _resolve_palette(colors: Optional[List[str]], n: int) -> List[str]:
    """Return a list of n valid matplotlib color strings.

    If colors is provided (hex list) convert each entry so matplotlib accepts them.
    Falls back to a viridis palette when nothing is supplied.
    """
    if colors:
        resolved = []
        for c in colors:
            try:
                mcolors.to_rgba(c)
                resolved.append(c)
            except ValueError:
                pass
        if resolved:
            full = [resolved[i % len(resolved)] for i in range(n)]
            return full
    return [mcolors.to_hex(c) for c in sns.color_palette("viridis", n)]


def generate_chart(
    data: List[Dict[str, Any]],
    chart_type: str,
    x_key: str,
    y_key: str,
    title: str = "Chart",
    colors: Optional[List[str]] = None,
    output_format: str = "png",
) -> io.BytesIO:
    plt.clf()
    plt.figure(figsize=(10, 6))

    df = pd.DataFrame(data)

    if df.empty:
        raise ValueError("Data is empty")

    if x_key not in df.columns or y_key not in df.columns:
        raise ValueError(f"Columns {x_key} or {y_key} not found in data")

    n = len(df)
    palette = _resolve_palette(colors, n)

    try:
        if chart_type == "bar":
            ax = plt.gca()
            x_vals = df[x_key].astype(str)
            y_vals = pd.to_numeric(df[y_key], errors="coerce")
            bars = ax.bar(x_vals, y_vals, color=palette[:n])
            ax.set_xlabel(x_key)
            ax.set_ylabel(y_key)

        elif chart_type == "horizontal-bar":
            ax = plt.gca()
            x_vals = df[x_key].astype(str)
            y_vals = pd.to_numeric(df[y_key], errors="coerce")
            ax.barh(x_vals, y_vals, color=palette[:n])
            ax.set_xlabel(y_key)
            ax.set_ylabel(x_key)

        elif chart_type == "line":
            ax = plt.gca()
            ax.plot(df[x_key].astype(str), pd.to_numeric(df[y_key], errors="coerce"),
                    marker="o", color=palette[0])
            ax.set_xlabel(x_key)
            ax.set_ylabel(y_key)

        elif chart_type == "area":
            ax = plt.gca()
            y_vals = pd.to_numeric(df[y_key], errors="coerce")
            ax.fill_between(df[x_key].astype(str), y_vals, alpha=0.4, color=palette[0])
            ax.plot(df[x_key].astype(str), y_vals, color=palette[0])
            ax.set_xlabel(x_key)
            ax.set_ylabel(y_key)

        elif chart_type in ("pie", "donut"):
            pie_data = df.groupby(x_key)[y_key].sum()
            n_pie = len(pie_data)
            pie_colors = _resolve_palette(colors, n_pie)
            wedgeprops = {"width": 0.5} if chart_type == "donut" else None
            plt.pie(pie_data, labels=pie_data.index, autopct="%1.1f%%",
                    colors=pie_colors, wedgeprops=wedgeprops)

        elif chart_type == "scatter":
            ax = plt.gca()
            ax.scatter(df[x_key], pd.to_numeric(df[y_key], errors="coerce"),
                       c=palette[:n])
            ax.set_xlabel(x_key)
            ax.set_ylabel(y_key)

        else:
            ax = plt.gca()
            ax.bar(df[x_key].astype(str), pd.to_numeric(df[y_key], errors="coerce"),
                   color=palette[:n])

        plt.title(title)
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()

        buf = io.BytesIO()
        fmt = output_format.lower() if output_format.lower() in ("png", "svg") else "png"
        plt.savefig(buf, format=fmt, dpi=100)
        buf.seek(0)
        plt.close()
        return buf

    except Exception as e:
        plt.clf()
        plt.text(0.5, 0.5, f"Error generating chart:\n{str(e)}", ha="center", va="center",
                 transform=plt.gca().transAxes)
        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        buf.seek(0)
        plt.close()
        return buf
