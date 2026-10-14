from PIL import Image

def process_image():
    img = Image.open('public/beer-mug-logo.png')
    img = img.convert("RGBA")
    datas = img.getdata()
    
    # Background color is roughly the top left pixel
    bg_color = datas[0]
    
    new_data = []
    tolerance = 25
    for item in datas:
        if abs(item[0] - bg_color[0]) < tolerance and abs(item[1] - bg_color[1]) < tolerance and abs(item[2] - bg_color[2]) < tolerance:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    # Crop transparent borders
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save('public/beer-mug-logo.png', "PNG")
    print("Done")

process_image()
