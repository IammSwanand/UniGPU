"""Generate the UniGPU Agent tray icon as an .ico file."""
from PIL import Image, ImageDraw, ImageFont
import os

def generate_icon():
    sizes = [16, 32, 48, 64, 128, 256]
    images = []

    for size in sizes:
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Purple background circle
        pad = max(1, size // 16)
        draw.ellipse([pad, pad, size - pad, size - pad], fill="#7c3aed")
        
        # Inner darker circle
        inner_pad = pad + max(1, size // 12)
        draw.ellipse([inner_pad, inner_pad, size - inner_pad, size - inner_pad], fill="#6d28d9")
        
        # 'U' letter
        font_size = size // 2
        try:
            font = ImageFont.truetype("segoeui.ttf", font_size)
        except (IOError, OSError):
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except (IOError, OSError):
                font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), "U", font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        tx = (size - tw) // 2
        ty = (size - th) // 2 - max(1, size // 16)
        draw.text((tx, ty), "U", fill="white", font=font)
        
        images.append(img)

    out_path = os.path.join(os.path.dirname(__file__), "assets", "icon.ico")
    images[-1].save(
        out_path,
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=images[:-1],
    )
    print(f"Icon saved to {out_path}")

if __name__ == "__main__":
    generate_icon()
