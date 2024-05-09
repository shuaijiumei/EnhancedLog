from flask import Flask, request, jsonify
from sacrebleu import corpus_bleu

app = Flask(__name__)

@app.route('/bleu', methods=['POST'])
def calculate_bleu():
    data = request.json
    candidate = data['candidate']
    reference = data['reference']
    bleu_score = corpus_bleu([candidate], [[reference]]).score
    return jsonify({'bleu_score': bleu_score})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
