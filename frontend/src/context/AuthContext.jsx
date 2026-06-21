import { createContext, useContext, useEffect, useState } from 'react';
import { auth, rtdb } from '../firebase';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { ref, set, onDisconnect, serverTimestamp } from 'firebase/database';

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
            const userStatusRef = ref(rtdb, `status/${auth.currentUser.uid}`);
            await set(userStatusRef, {
                online: false,
                lastSeen: serverTimestamp()
            });
        }
        return await signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setLoading(false);

            if (user) {
                // Online set karo
                const userStatusRef = ref(rtdb, `status/${user.uid}`);

                await set(userStatusRef, {
                    online: true,
                    lastSeen: serverTimestamp()
                });

                // Browser band ho ya connection toote toh offline ho jaao
                onDisconnect(userStatusRef).set({
                    online: false,
                    lastSeen: serverTimestamp()
                });
            }
        });

        return unsubscribe;
    }, []);

    const value = { currentUser, login, logout, requestNotificationPermission };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};