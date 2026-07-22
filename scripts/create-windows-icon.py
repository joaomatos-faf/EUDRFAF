from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "build" / "icon.ico"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

size = 256
image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((8, 8, 248, 248), radius=56, fill="#17372a")
draw.rounded_rectangle((28, 28, 228, 228), radius=42, outline="#dfe9d8", width=6)
draw.ellipse((104, 28, 152, 76), fill="#bd5c2e")
draw.polygon([(128, 52), (112, 100), (144, 100)], fill="#bd5c2e")

font_path = Path("C:/Windows/Fonts/seguisb.ttf")
font = ImageFont.truetype(str(font_path), 72) if font_path.exists() else ImageFont.load_default()
text = "FAF"
box = draw.textbbox((0, 0), text, font=font)
text_width = box[2] - box[0]
draw.text(((size - text_width) / 2, 105), text, font=font, fill="#fffefa")

image.save(
    OUTPUT,
    format="ICO",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print(OUTPUT)
