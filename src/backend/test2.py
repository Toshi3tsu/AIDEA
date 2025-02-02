import socket
import ssl
import OpenSSL.crypto

def get_certificate_from_url(url, port=443):
    """
    指定されたURLからSSL証明書を取得する。

    Args:
        url (str): 証明書を取得するURL (例: api.box.com)
        port (int): ポート番号 (デフォルト: 443)

    Returns:
        str: PEM形式の証明書文字列、またはエラーの場合はNone
    """
    try:
        context = ssl.create_default_context()
        with socket.create_connection((url, port)) as sock:
            with context.wrap_socket(sock, server_hostname=url) as ssock:
                der_cert = ssock.getpeercert(binary_form=True)
                pem_cert = ssl.DER_cert_to_PEM_cert(der_cert)
                return pem_cert
    except Exception as e:
        print(f"証明書の取得に失敗しました: {e}")
        return None

if __name__ == "__main__":
    url = "api.box.com"
    certificate = get_certificate_from_url(url)
    if certificate:
        print(certificate)
        # 証明書をファイルに保存する場合
        with open("box_api_certificate.pem", "w") as f:
            f.write(certificate)
        print("証明書を box_api_certificate.pem に保存しました。")