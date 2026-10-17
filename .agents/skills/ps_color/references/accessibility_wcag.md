# WCAG 2.1 Accessibility & Contrast Guide

The Web Content Accessibility Guidelines (WCAG) 2.1 require sufficient luminance contrast between foreground text/elements and their background.

---

## 1. Relative Luminance Formula

Relative luminance ($L$) is defined in WCAG 2.1 as the relative brightness of any point in a colorspace, normalized to 0 for darkest black and 1 for lightest white.

### Step-by-Step Calculation:
1. Extract 8-bit RGB components ($R, G, B \in [0, 255]$).
2. Convert each channel to linearized sRGB ($sRGB \in [0, 1]$):
   $$C = c / 255$$
   $$C_{\text{linear}} = \begin{cases} C / 12.92 & \text{if } C \le 0.03928 \\ \left(\frac{C + 0.055}{1.055}\right)^{2.4} & \text{if } C > 0.03928 \end{cases}$$
3. Combine linearized channels using standard ITU-R BT.709 coefficients:
   $$L = 0.2126 R_{\text{linear}} + 0.7152 G_{\text{linear}} + 0.0722 B_{\text{linear}}$$

---

## 2. Contrast Ratio Formula

Given two colors with relative luminances $L_1$ and $L_2$ where $L_1 \ge L_2$:

$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

The constant `0.05` represents the ambient flare contribution.
Contrast ratios range from **1:1** (identical colors) to **21:1** (pure white `#FFFFFF` vs. pure black `#000000`).

---

## 3. WCAG Threshold Ratings

| Level | Minimum Ratio | Applicable Scenarios |
| :--- | :---: | :--- |
| **WCAG AAA** | **$\ge 7.0:1$** | Enhanced contrast for regular body text ($< 18\text{pt}$ or $< 14\text{pt}$ bold). |
| **WCAG AA** | **$\ge 4.5:1$** | Standard minimum threshold for body text in web applications. |
| **WCAG AA Large** | **$\ge 3.0:1$** | Large text ($\ge 18\text{pt}$ or $\ge 14\text{pt}$ bold) and UI components/icons. |
| **Fail** | **$< 3.0:1$** | Insufficient contrast. Should not be used for informative text. |

---

## 4. Benchmark Reference Values

- `#FFFFFF` vs `#000000` $\implies$ **21.0:1** (AAA Pass)
- `#FFFFFF` vs `#FFFFFF` $\implies$ **1.0:1** (Fail)
- `#FFFFFF` vs `#767676` $\implies$ **4.54:1** (AA Pass)
- `#FFFFFF` vs `#595959` $\implies$ **7.00:1** (AAA Pass)
