# UniGPU Agent — GUI Modules
# Lazy imports only — tkinter/pystray not always available

def get_icon_path():
    import sys
    from pathlib import Path
    if hasattr(sys, '_MEIPASS'):
        return Path(sys._MEIPASS) / "assets" / "icon.ico"
    return Path(__file__).parent.parent.parent / "assets" / "icon.ico"
