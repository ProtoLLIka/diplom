from deeppavlov import train_model
from deeppavlov import build_model
m = train_model("./config.json")
m = build_model("./config.json")
# Поднять API
# python -m deeppavlov riseapi config.json