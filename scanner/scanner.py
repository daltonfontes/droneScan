import cv2
from pyzbar.pyzbar import decode
import websocket
import threading
import time
import json
from datetime import datetime

class Scanner:
    def __init__(self, ws_url: str, camera_index: int = 0, shelf_id: int = 1):
        self.ws_url = ws_url
        self.ws = None
        self.cap = cv2.VideoCapture(camera_index)
        self.running = True
        self.scanned_list = {}
        self.shelfId = shelf_id

        # TODO: detectar se a caixa já está aberta
        
    def on_open(self, ws: websocket.WebSocket):
        print("Conectado ao websocket")
        
        payload = {"type": "hello", "role": "sim"}
        ws.send(json.dumps(payload))
        print(ws.recv())
        
    def on_close(self, ws: websocket.WebSocket):
        print("Conexão fechada com o websocket")
    
    def on_message(self, ws: websocket.WebSocket):
        print(ws.recv())
        
    def connect(self):
        while self.running:
            try:
                self.ws = websocket.WebSocketApp(
                    self.ws_url,
                    on_open=self.on_open,
                    on_close=self.on_close,
                    on_message=self.on_message
                )
                self.ws.run_forever()
            except Exception as e:
                print(f"Erro no WebSocket: {e}")
            print("Tentando reconectar em 5s...")
            time.sleep(5)
            
    def send(self, barcode: str):
        if self.ws:
            try:
                if self.shelfId not in self.scanned_list:
                    self.scanned_list[self.shelfId] = {}
                
                if barcode not in self.scanned_list[self.shelfId]:
                    payload = {
                        "role": "sim",
                        "type": "scan",
                        "payload": {
                            "barcode": barcode,
                            "shelfId": self.shelfId,
                            "isOpen": 0,
                            "scannedAt": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        }
                    }
                    
                    self.scanned_list[self.shelfId][barcode] = {
                        "scannedAt": payload["payload"]["scannedAt"],
                        "isOpen": payload["payload"]["isOpen"]
                    }
                    
                    self.ws.send(json.dumps(payload))
                    print(f"Código enviado: {barcode}")
            except Exception as e:
                print(f"Falha ao enviar código: {e}")
    
    def run(self):
        threading.Thread(target=self.connect, daemon=True).start()
        
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                print("Falha ao acessar câmera")
                break

            decoded_objects = decode(frame)
            for obj in decoded_objects:
                barcode_data = str(obj.data.decode("utf-8"))
                print(f"Detectado: {barcode_data}")

                self.send(barcode_data)
                
                (x, y, w, h) = obj.rect
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
            cv2.imshow("Scanner", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                print("Encerrando scanner...")
                break

        self.stop()
        
    def stop(self):
        self.running = False
        
        if self.cap.isOpened():
            self.cap.release()
            
        cv2.destroyAllWindows()
        
        if self.ws:
            try:
                self.ws.close()
            except Exception:
                pass
            
        print("Scanner desativado.")


if __name__ == "__main__":
    scanner = Scanner("ws://localhost:3001/")
    try:
        scanner.run()
    except KeyboardInterrupt:
        scanner.stop()