from flask import Flask, request, jsonify
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/webhook/receive-patient', methods=['POST'])
def receive_patient():
    try:
        data = request.json
        
        # Log basic info
        patient_id = data.get('patient_id', 'Unknown')
        name = f"{data.get('first_name', '')} {data.get('last_name', '')}"
        
        print(f"\n======== RECEIVED PATIENT DATA ========")
        print(f"ID: {patient_id}")
        print(f"Name: {name}")
        
        import json
        print(json.dumps(data, indent=4))
        print("=======================================\n")
        
        logger.info(f"Successfully processed patient: {name}")
        
        return jsonify({"status": "success", "message": f"Received {name}"}), 200

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Mock Webhook Listener running on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)
