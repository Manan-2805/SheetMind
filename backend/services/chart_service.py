import io
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from typing import List, Optional, Dict, Any

# Set style
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = [10, 6]
plt.rcParams['font.size'] = 12

def generate_chart(
    data: List[Dict[str, Any]],
    chart_type: str,
    x_key: str,
    y_key: str,
    title: str = "Chart",
    colors: Optional[List[str]] = None,
    output_format: str = "png"
) -> io.BytesIO:
    # Clear current figure
    plt.clf()
    
    df = pd.DataFrame(data)
    
    if df.empty:
        raise ValueError("Data is empty")
    
    if x_key not in df.columns or y_key not in df.columns:
        raise ValueError(f"Columns {x_key} or {y_key} not found in data")

    # Map colors if provided
    palette = colors if colors else "viridis"
    
    try:
        if chart_type == "bar":
            sns.barplot(data=df, x=x_key, y=y_key, palette=palette)
        elif chart_type == "horizontal-bar":
            sns.barplot(data=df, x=y_key, y=x_key, palette=palette, orient='h')
        elif chart_type == "line":
            sns.lineplot(data=df, x=x_key, y=y_key, marker='o', palette=palette)
        elif chart_type == "area":
            plt.fill_between(df[x_key], df[y_key], alpha=0.3)
            sns.lineplot(data=df, x=x_key, y=y_key, palette=palette)
        elif chart_type == "pie" or chart_type == "donut":
            # Group by x_key and sum y_key for pie
            pie_data = df.groupby(x_key)[y_key].sum()
            wedgeprops = {'width': 0.3} if chart_type == "donut" else None
            plt.pie(pie_data, labels=pie_data.index, autopct='%1.1f%%', colors=colors, wedgeprops=wedgeprops)
        elif chart_type == "scatter":
            sns.scatterplot(data=df, x=x_key, y=y_key, palette=palette)
        elif chart_type == "histogram":
            sns.histplot(data=df, x=x_key, palette=palette)
        else:
            # Fallback to bar
            sns.barplot(data=df, x=x_key, y=y_key, palette=palette)
            
        plt.title(title)
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format=output_format, dpi=100)
        buf.seek(0)
        return buf
        
    except Exception as e:
        plt.clf()
        # Create an error image
        plt.text(0.5, 0.5, f"Error generating chart:\n{str(e)}", ha='center', va='center')
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        return buf
