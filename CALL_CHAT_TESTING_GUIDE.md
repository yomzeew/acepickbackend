# Call & Chat Testing Guide - Test Accounts Setup Complete! 🎉

## 📋 **Test Accounts Created**

All test accounts are now set up with relationships for comprehensive testing:

| Account Type | Email | Password | Name | Role |
|--------------|-------|----------|------|------|
| **Client** | `john.client@test.com` | `Test@1234` | John Adeyemi | Client |
| **Professional** | `emeka.pro@test.com` | `Test@1234` | Emeka Obi | Professional (Web Developer) |
| **Rider** | `kola.rider@test.com` | `Test@1234` | Kola Amadi | Delivery Rider |

## 🗨️ **Chat Rooms Created**

### 1. **Client ↔ Professional Chat**
- **Room**: `Client-Professional Chat`
- **Members**: John Adeyemi ↔ Emeka Obi
- **Messages**: 4 sample messages about web development project
- **Use Case**: Professional service discussion

### 2. **Client ↔ Rider Chat**
- **Room**: `Client-Rider Chat`
- **Members**: John Adeyemi ↔ Kola Amadi
- **Messages**: 2 sample messages about package delivery
- **Use Case**: Delivery coordination

### 3. **Professional ↔ Rider Chat**
- **Room**: `Professional-Rider Chat`
- **Members**: Emeka Obi ↔ Kola Amadi
- **Messages**: 2 sample messages about equipment transport
- **Use Case**: Logistics coordination

### 4. **Group Chat - All Three**
- **Room**: `Group Chat - All Three`
- **Members**: John Adeyemi, Emeka Obi, Kola Amadi
- **Messages**: 3 sample introduction messages
- **Use Case**: Multi-user communication testing

## 📞 **Call Testing Scenarios**

### **Scenario 1: Client Calls Professional**
1. **Login**: John Adeyemi (`john.client@test.com`)
2. **Navigate**: Find Emeka Obi in contacts/professionals
3. **Initiate Call**: Tap call button
4. **Expected**: Emeka receives incoming call notification
5. **Test**: Accept/reject call functionality

### **Scenario 2: Professional Calls Client**
1. **Login**: Emeka Obi (`emeka.pro@test.com`)
2. **Navigate**: Find John Adeyemi in clients
3. **Initiate Call**: Tap call button
4. **Expected**: John receives incoming call notification
5. **Test**: Call quality and disconnection

### **Scenario 3: Rider Calls Client**
1. **Login**: Kola Amadi (`kola.rider@test.com`)
2. **Navigate**: Find John Adeyemi in delivery contacts
3. **Initiate Call**: Call about delivery details
4. **Expected**: John receives call while using app
5. **Test**: Background call handling

### **Scenario 4: Group Call Testing**
1. **Login**: Any account
2. **Navigate**: Group chat room
3. **Initiate Call**: Test group call functionality
4. **Expected**: Multiple participants can join
5. **Test**: Call management with multiple users

## 💬 **Chat Testing Scenarios**

### **Scenario 1: Professional Service Discussion**
1. **Participants**: John Adeyemi ↔ Emeka Obi
2. **Room**: Client-Professional Chat
3. **Test**: Message exchange, file sharing, typing indicators
4. **Expected**: Real-time message delivery

### **Scenario 2: Delivery Coordination**
1. **Participants**: John Adeyemi ↔ Kola Amadi
2. **Room**: Client-Rider Chat
3. **Test**: Location sharing, delivery updates
4. **Expected**: Quick response times

### **Scenario 3: Multi-User Communication**
1. **Participants**: All three users
2. **Room**: Group Chat - All Three
3. **Test**: Group messaging, online status
4. **Expected**: All users see messages simultaneously

## 🔄 **Test Workflow**

### **Step 1: User Setup**
```bash
# Ensure backend is running
cd /Volumes/ExternalSSD/acepickbackend/acepickapi
npm run dev

# Ensure frontend is running
cd /Volumes/ExternalSSD/acepick
npm start
```

### **Step 2: Login Testing**
1. Open multiple browser tabs or devices
2. Login with different test accounts
3. Verify all users appear online
4. Test simultaneous login

### **Step 3: Chat Testing**
1. Navigate to chat section
2. Select different chat rooms
3. Send messages between users
4. Test message delivery and read receipts

### **Step 4: Call Testing**
1. Initiate calls between different user pairs
2. Test incoming call notifications
3. Test call acceptance/rejection
4. Test call quality and disconnection

### **Step 5: Integration Testing**
1. Start chat conversation
2. Escalate to voice call
3. Return to chat after call
4. Test seamless transition

## 🧪 **Advanced Testing**

### **Network Conditions**
- Test with poor network connectivity
- Test call reconnection
- Test message queuing and delivery

### **Multi-Device Testing**
- Same account on multiple devices
- Test synchronization
- Test call handoff between devices

### **Stress Testing**
- Multiple simultaneous calls
- High message volume
- Concurrent user interactions

## 📊 **Expected Behaviors**

### **Call Features**
- ✅ Incoming call notifications
- ✅ Call acceptance/rejection
- ✅ Mute/unmute functionality
- ✅ Speaker toggle
- ✅ Call duration tracking
- ✅ Proper call termination

### **Chat Features**
- ✅ Real-time message delivery
- ✅ Online status indicators
- ✅ Message read receipts
- ✅ Typing indicators
- ✅ File/image sharing
- ✅ Message history

### **Integration Features**
- ✅ Chat to call escalation
- ✅ Call to chat return
- ✅ Contact synchronization
- ✅ Status updates

## 🔧 **Troubleshooting**

### **Common Issues**
1. **Calls not connecting**: Check WebRTC configuration
2. **Messages not delivering**: Verify socket connection
3. **Users not appearing online**: Check online user table
4. **Audio not working**: Verify microphone permissions

### **Debug Commands**
```bash
# Check online users
SELECT * FROM online_users WHERE isOnline = true;

# Check chat rooms
SELECT * FROM chat_rooms;

# Check recent messages
SELECT * FROM messages ORDER BY timestamp DESC LIMIT 10;

# Check user profiles
SELECT u.email, p.firstName, p.lastName, u.role 
FROM users u 
LEFT JOIN profiles p ON u.id = p.userId 
WHERE u.email IN ('john.client@test.com', 'emeka.pro@test.com', 'kola.rider@test.com');
```

## 📱 **Mobile Testing**

### **iOS Testing**
1. Open Expo Go app
2. Scan development QR code
3. Test with different devices
4. Test background/foreground modes

### **Android Testing**
1. Install Expo Go from Play Store
2. Scan development QR code
3. Test with various Android versions
4. Test permission handling

## 🎯 **Success Criteria**

### **Must Pass**
- ✅ All users can login successfully
- ✅ Chat messages deliver in real-time
- ✅ Calls connect between any two users
- ✅ Call notifications work properly
- ✅ Users appear online correctly

### **Should Pass**
- ✅ File sharing works in chat
- ✅ Group chat functions properly
- ✅ Call quality is acceptable
- ✅ App handles network interruptions
- ✅ Multiple device support

### **Nice to Have**
- ✅ Call recording functionality
- ✅ Video calling capabilities
- ✅ Screen sharing during calls
- ✅ Advanced chat features (reactions, replies)

## 📞 **Support**

If you encounter issues during testing:

1. **Check Backend Logs**: Look for socket connection errors
2. **Check Frontend Console**: Look for WebRTC errors
3. **Verify Database**: Ensure test data is correctly seeded
4. **Network Check**: Verify all devices are on same network

## 🎉 **Ready to Test!**

Your test environment is now fully configured with:
- ✅ 3 test accounts with proper relationships
- ✅ 4 chat rooms with sample messages
- ✅ Online status for all users
- ✅ Sample job for professional-client interaction
- ✅ Comprehensive testing scenarios

Start testing and enjoy the call and chat functionality! 🚀
