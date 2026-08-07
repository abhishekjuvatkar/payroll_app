import os

os.system(
    'alembic revision --autogenerate -m "Auto Migration"'
)

os.system(
    "alembic upgrade head"
)