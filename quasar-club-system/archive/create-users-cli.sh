#!/bin/bash

# Array of user names
users=("ulda" "onis" "havlis" "jandys" "pepik" "misakaucky" "kubakaucky" "majkl" "honkic" "rada" "suly" "johny" "bambus" "max" "dan" "paja" "trenermara" "simon" "wulfi" "machy" "kubaHeri" "rolin" "svanci" "elky")

echo "Creating ${#users[@]} users..."

# Create import file for Firebase Auth
cat > users-import.json << 'EOF'
{
  "users": [
EOF

# Generate user data for import
for i in "${!users[@]}"; do
    name="${users[$i]}"
    email="${name}@test.cz"
    
    # Add comma except for last item
    if [ $i -eq $((${#users[@]} - 1)) ]; then
        comma=""
    else
        comma=","
    fi
    
    cat >> users-import.json << EOF
    {
      "localId": "user_${name}_$(date +%s)_${i}",
      "email": "${email}",
      "displayName": "${name}",
      "passwordHash": "UkVEQUNURUQ=",
      "salt": "Ym9ndXM=",
      "emailVerified": false
    }${comma}
EOF
done

cat >> users-import.json << 'EOF'
  ]
}
EOF

echo "✅ Generated users-import.json file"

# Import users using Firebase CLI
echo "📥 Importing users to Firebase Auth..."
firebase auth:import users-import.json --hash-algo=REDACTED

echo "🎉 User creation completed!"
echo "All users have been created with:"
echo "  - Email: {name}@test.cz"
echo "  - Password: 123456 (you'll need to set this manually in Firebase Console)"
echo "  - Display Name: {name}"