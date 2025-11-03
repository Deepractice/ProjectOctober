docker run -d \
    --name agent \
    -p 5200:5200 \
    -e ANTHROPIC_API_KEY=cr_4f8480bb84b2c985a268f707f64a95c894d6b29a8f99351e1d262a548cca5932 \
    -e ANTHROPIC_BASE_URL=https://relay.deepractice.ai/api \
    -v .:/project \
    deepracticexs/agent:latest
