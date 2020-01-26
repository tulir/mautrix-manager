import setuptools

from mautrix_manager import __version__

try:
    long_desc = open("../README.md").read()
except IOError:
    long_desc = "Failed to read README.md"

setuptools.setup(
    name="mautrix-manager",
    version=__version__,
    url="https://github.com/tulir/mautrix-manager",

    author="Tulir Asokan",
    author_email="tulir@maunium.net",

    description="A web interface for managing bridges",
    long_description=long_desc,
    long_description_content_type="text/markdown",

    packages=setuptools.find_packages(),

    install_requires=[
        "aiohttp>=3,<4",
        "mautrix>=0.4,<0.5",
        "ruamel.yaml>=0.15.90,<0.17",
        "yarl>=1,<2",
        "aiosqlite>=0.11,<0.12",
        "asyncpg>=0.20,<0.21",
        "attrs>=18.1.0",
    ],
    python_requires="~=3.6",

    classifiers=[
        "Development Status :: 3 - Alpha",
        "License :: OSI Approved :: GNU Affero General Public License v3 or later (AGPLv3+)",
        "Framework :: AsyncIO",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
    ],
    entry_points="""
        [console_scripts]
        mautrix-manager=mautrix_manager.__main__:main
    """,
    package_data={"mautrix_manager": [
        "frontend/index.*", "frontend/views/*", "frontend/lib/*", "frontend/res/*",
        "frontend/web_modules/**/*"
    ]},
    data_files=[
        (".", ["example-config.yaml"]),
#        ("alembic", ["alembic/env.py"]),
#        ("alembic/versions", glob.glob("alembic/versions/*.py"))
    ],
)
