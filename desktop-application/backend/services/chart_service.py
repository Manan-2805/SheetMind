import io
from typing import Any, Dict, List, Optional

import matplotlib
import matplotlib.colors as mcolors
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

matplotlib.use("Agg")

sns.set_theme(style="whitegrid")
plt.rcParams["figure.figsize"] = [10, 6]
plt.rcParams["font.size"] = 12


def _resolve_palette(colors: Optional[List[str]], n: int) -> List[str]:
    """Return a list of n valid matplotlib color strings."""
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
    value_key: Optional[str] = None,
) -> io.BytesIO:
    plt.clf()
    plt.figure(figsize=(10, 6))

    df = pd.DataFrame(data)

    if df.empty:
        raise ValueError("Data is empty")

    n = len(df)
    palette = _resolve_palette(colors, n)

    try:
        if chart_type == "bar":
            ax = plt.gca()
            x_vals = df[x_key].astype(str)
            y_vals = pd.to_numeric(df[y_key], errors="coerce")
            ax.bar(x_vals, y_vals, color=palette[:n])
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
            ax.plot(
                df[x_key].astype(str),
                pd.to_numeric(df[y_key], errors="coerce"),
                marker="o",
                color=palette[0],
            )
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
            plt.pie(
                pie_data,
                labels=pie_data.index,
                autopct="%1.1f%%",
                colors=pie_colors,
                wedgeprops=wedgeprops,
            )

        elif chart_type == "scatter":
            ax = plt.gca()
            ax.scatter(
                df[x_key],
                pd.to_numeric(df[y_key], errors="coerce"),
                c=palette[:n],
            )
            ax.set_xlabel(x_key)
            ax.set_ylabel(y_key)

        elif chart_type == "histogram":
            ax = plt.gca()
            numeric_vals = pd.to_numeric(df[x_key], errors="coerce").dropna()
            ax.hist(numeric_vals, bins=20, color=palette[0], edgecolor="white")
            ax.set_xlabel(x_key)
            ax.set_ylabel("Frequency")

        elif chart_type == "heatmap":
            val_col = value_key if value_key and value_key in df.columns else y_key
            pivot = df.pivot_table(
                index=y_key,
                columns=x_key,
                values=val_col,
                aggfunc="sum",
            )
            cmap = "YlOrRd"
            sns.heatmap(pivot, annot=True, fmt=".0f", cmap=cmap, linewidths=0.5)

        elif chart_type == "pivot":
            val_col = value_key if value_key and value_key in df.columns else y_key
            pivot = df.pivot_table(
                index=y_key,
                columns=x_key,
                values=val_col,
                aggfunc="sum",
                margins=True,
                margins_name="Total",
            ).fillna(0)

            fig, ax = plt.subplots(figsize=(max(10, len(pivot.columns) * 1.5), max(6, len(pivot) * 0.5)))
            ax.axis("off")
            tbl = ax.table(
                cellText=[[f"{v:.0f}" if isinstance(v, (int, float)) else str(v) for v in row]
                          for row in pivot.values],
                colLabels=[str(c) for c in pivot.columns],
                rowLabels=[str(i) for i in pivot.index],
                cellLoc="center",
                loc="center",
            )
            tbl.auto_set_font_size(False)
            tbl.set_fontsize(10)
            tbl.scale(1.2, 1.4)
            plt.subplots_adjust(left=0.2, right=0.95)

        else:
            ax = plt.gca()
            ax.bar(
                df[x_key].astype(str),
                pd.to_numeric(df[y_key], errors="coerce"),
                color=palette[:n],
            )

        if chart_type not in ("pivot",):
            plt.title(title)
            plt.xticks(rotation=45, ha="right")
            plt.tight_layout()
        else:
            plt.title(title, pad=20)
            plt.tight_layout()

        buf = io.BytesIO()
        fmt = output_format.lower() if output_format.lower() in ("png", "svg") else "png"
        plt.savefig(buf, format=fmt, dpi=100)
        buf.seek(0)
        plt.close()
        return buf

    except Exception as e:
        plt.clf()
        plt.text(
            0.5,
            0.5,
            f"Error generating chart:\n{str(e)}",
            ha="center",
            va="center",
            transform=plt.gca().transAxes,
        )
        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        buf.seek(0)
        plt.close()
        return buf
