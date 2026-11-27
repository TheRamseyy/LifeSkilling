# Shared helpers for the build scripts: perk strength at a gear score, and filling in the
# numbers in game text such as "+{[0.1 * 100 * {perkMultiplier}]}% resources while Mining."
import ast
import operator
import re


def multiplier(scaling, gs):
    """Perk strength at a gear score. Scaling is per gear score above 100,
    either one number or segments like '0.003,550:0.00' (0.003 up to 550, then 0)."""
    if scaling in (None, "") or not gs:
        return 1.0
    parts = str(scaling).split(",")
    segs = [(100, float(parts[0]))] + [(float(a), float(b)) for a, b in (p.split(":") for p in parts[1:])]
    m = 1.0
    for i, (start, slope) in enumerate(segs):
        end = segs[i + 1][0] if i + 1 < len(segs) else 10 ** 6
        if gs > start:
            m += (min(gs, end) - start) * slope
    return m


OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv, ast.USub: operator.neg}


def calc(expr):
    """Arithmetic only (numbers and + - * /); anything else raises."""
    def ev(n):
        if isinstance(n, ast.Expression):
            return ev(n.body)
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)):
            return n.value
        if isinstance(n, ast.BinOp) and type(n.op) in OPS:
            return OPS[type(n.op)](ev(n.left), ev(n.right))
        if isinstance(n, ast.UnaryOp) and type(n.op) in OPS:
            return OPS[type(n.op)](ev(n.operand))
        raise ValueError(expr)
    return ev(ast.parse(expr, mode="eval"))


def fill(text, m=1.0):
    """Fill {[...]} number blocks in game text. Returns (text, [numbers])."""
    vals = []

    def one(mt):
        # some game text has typos: a stray "]" or a missing "*" before {perkMultiplier}
        expr = mt.group(1).replace("[", "").replace("]", "")
        expr = re.sub(r"([\d.)])\s*\{perkMultiplier\}", r"\1 * {perkMultiplier}", expr)
        try:
            v = calc(expr.replace("{perkMultiplier}", repr(m)))
        except (ValueError, SyntaxError, ZeroDivisionError):
            return mt.group(0)
        vals.append(v)
        return ("%.1f" % v).rstrip("0").rstrip(".")
    out = re.sub(r"\{\[((?:[^{}]|\{perkMultiplier\})*?)\]\}", one, text or "")
    # game bullets come through as a replacement character; make them plain bullets
    out = out.replace("�", "•").replace("\\n", "\n")
    return out, vals
