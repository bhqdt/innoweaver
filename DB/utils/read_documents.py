


# this file is used to read the txt of pdf documents

import os
import json

def read_from_txt(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()
    
