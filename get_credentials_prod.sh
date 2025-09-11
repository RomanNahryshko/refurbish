function function_get_credential () {
rm -rf env.ini && touch env.ini
aws ssm get-parameters-by-path --path "/REMOBILE-REFURBISH/prod/" --query="Parameters[*]" --region $AWS_DEFAULT_REGION --output text --with-decryption > 1.ini
while read line
    do
    VALUE=$(echo $line | awk '{print $6}')
    VARIABLE=$(echo $line | awk '{print $1}' | sed "s/\\// /g" | awk '{ print $NF }')
    echo "$VARIABLE=$VALUE" >> env.ini
done < 1.ini
FWC=$(ls -la | grep env.ini | wc -l) && if  [ "$FWC" != "1" ]; then echo "===>>>Failed to get project secret to build"; exit 1; fi

#aws ssm get-parameters-by-path --path "/redistribution/dev/$1/" --recursive --query="Parameters[*].[Value]" --region eu-central-1 --output text >> env.ini
}
