import { createContext, useContext, useEffect, useState } from 'react';
import { auth, rtdb, db } from '../firebase';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { ref, set, onDisconnect, serverTimestamp, update, } from 'firebase/database';
import { doc, setDoc, getDoc } from 'firebase/firestore';


const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = async (email, password) => {
        return await signInWithEmailAndPassword(auth, email, password);
    };

    // Notification permission maango
    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            await Notification.requestPermission();
        }
    };

    const logout = async () => {
        // Logout pe offline set karo
        if (auth.currentUser) {

            // save mood
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            const savedMood = userDoc.data()?.mood || '';

            const userStatusRef = ref(rtdb, `status/${auth.currentUser.uid}`);
            await set(userStatusRef, {
                online: false,
                lastSeen: serverTimestamp(), 
                mood: savedMood
            });
        }
        return await signOut(auth);
    };


    // Mood update karo
    const updateMood = async (mood) => {
        if (auth.currentUser) {
            // Realtime DB mein bhi rakho (online status ke saath)
            const userStatusRef = ref(rtdb, `status/${auth.currentUser.uid}`);
            await update(userStatusRef, { mood });

            // Firestore mein permanently save karo
            await setDoc(doc(db, 'users', auth.currentUser.uid), {
                mood
            }, { merge: true });
        }
    };


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setLoading(false);

            if (user) {
                // Firestore se purana mood lo
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const savedMood = userDoc.data()?.mood || '';

                // Online set karo with saved mood
                const userStatusRef = ref(rtdb, `status/${user.uid}`);

                await set(userStatusRef, {
                    online: true,
                    lastSeen: serverTimestamp(),
                    mood: savedMood
                });

                // Browser band ho ya connection toote toh offline ho jaao
                onDisconnect(userStatusRef).set({
                    online: false,
                    lastSeen: serverTimestamp(),
                    mood: savedMood
                });
            }
        });

        return unsubscribe;
    }, []);

    const value = { currentUser, login, logout, requestNotificationPermission, updateMood };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};