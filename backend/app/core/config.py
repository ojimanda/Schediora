from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Schediora API'
    app_env: str = 'development'
    api_prefix: str = '/api/v1'
    debug: bool = True

    database_url: str = 'postgresql+psycopg://schediora:schediora@localhost:5432/schediora'
    redis_url: str = 'redis://localhost:6379/0'

    jwt_secret: str = 'replace-me'
    jwt_algorithm: str = 'HS256'
    jwt_access_expire_minutes: int = 30
    jwt_refresh_expire_minutes: int = 60 * 24 * 7

    ollama_base_url: str = 'http://localhost:11434'
    ollama_model: str = 'qwen2.5:7b'


settings = Settings()
