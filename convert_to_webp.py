from PIL import Image
import os

def convert_to_webp(input_path, output_path):
    try:
        img = Image.open(input_path)
        # Otimização e qualidade 80 para WebP
        img.save(output_path, "webp", quality=80, optimize=True)
        print(f"Sucesso: {input_path} convertido para {output_path}")
        return True
    except Exception as e:
        print(f"Erro ao converter {input_path}: {e}")
        return False

# Arquivos a serem convertidos
files_to_convert = [
    ("/home/ubuntu/upload/assinatura.png", "/home/ubuntu/upload/assinatura.webp"),
    ("/home/ubuntu/upload/logorecibo.png", "/home/ubuntu/upload/logorecibo.webp")
]

for input_file, output_file in files_to_convert:
    convert_to_webp(input_file, output_file)
