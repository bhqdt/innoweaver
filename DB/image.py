from PyPDF2 import PdfReader, PdfWriter, PdfFileReader

input_pdf_path = 'C:/Users/LENOVO/Downloads/申请/推荐信部分/推荐信/推荐信/推荐信.pdf'
output_pdf_path = 'C:/Users/LENOVO/Downloads/申请/推荐信部分/推荐信/推荐信/推荐信_edited.pdf'

reader = PdfReader(input_pdf_path)
writer = PdfWriter()
page1 = reader.pages[0]
page2 = reader.pages[1]

page2_text = page2.extract_text()
print(page2_text)

text_to_add = page2_text
text_to_add_content = page2_text
print(text_to_add_content)

page1_text = page1.extract_text() + text_to_add_content
page1_text_content = page1_text
# print(page1_text_content)

page1.mergePage(PdfFileReader(page1_text_content))
print(page1.extract_text())
# writer.add_page(page1)
# with open(output_pdf_path, "wb") as output_file:
#     writer.write(output_file)

# ---------------------------------------------------------------------------

# from openai import OpenAI
# from dotenv import load_dotenv
# import requests
# from io import BytesIO
# from PIL import Image

# def drawing_expert_system(client):
#     user_content = f'''
#         老人扶小孩过马路
#     '''

#     response = client.images.generate(
#             model="dall-e-3",
#             prompt=user_content,
#             size="1024x1024",
#             quality="standard",
#             n=1,
#         )

#     return response.data[0]

# ---------------------------------------------------------------------------

# client = OpenAI(api_key='sk-vyqfd43c2f2da522e0f342cf2de6afe999f4e4569dcDVmya', 
#                 base_url='https://api.gptsapi.net/v1')

# image = drawing_expert_system(client)
# response = requests.get(image.url)
# response.raise_for_status()
# image_pillow = Image.open(BytesIO(response.content))

# temp_image_path = f"./temp_image.jpg"
# image_pillow.save(temp_image_path, "JPEG", optimize=True, quality=30)

# try:
#     with open(r"C:/Users/LENOVO/Downloads/seyb24from-small.pdf", "rb") as file:
#         response = client.files.create(
#             file=file,
#             purpose='assistants'
#         )
#     file_id = response['id']
#     print(response, file_id)
# except Exception as e:
#     print("Error uploading file:", e)

# ---------------------------------------------------------------------------

# response = client.chat.completions.create(
#     model="gpt-4o-mini",
#     messages=[
#         {"role": "system", "content": "You are a helpful assistant that answers questions based on the provided document."},
#         {"role": "user", "content": "Please summarize the main points of the document."}
#     ],
#     file_id=file_id
# )

# client.beta.assistants.create
# print(response, response.choices[0].message)

# client.files.delete(file_id)
# print("File deleted.")