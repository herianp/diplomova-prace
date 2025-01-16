import { defineStore } from 'pinia'
import {auth, db} from "@/js/firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { RouteEnum } from "@/enums/routesEnum.js";
import { doc, setDoc } from "firebase/firestore";
import {useTeamStore} from "@/stores/team.js";

const getInitialUser = () => ({
    uid: '1',
});

export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        user: getInitialUser(),
    }),
    getters: {
    },
    actions: {
        init() {
            // check if user is already signed in, user is filled in after refresh
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    console.log(`User is signed in: ${JSON.stringify(user.uid)}`);
                    this.user = user;
                } else {
                    console.log(`User out: ${user}`);
                    this.router.push(RouteEnum.HOME.path);
                    useTeamStore().clearData();
                }
            });
        },
        async login(credentials) {
            await signInWithEmailAndPassword(auth, credentials.email, credentials.password).then(
                (userCredential) => {
                // Signed in
                this.user = userCredential.user;
                this.router.push(RouteEnum.HOME.path);
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(`Error code: ${errorCode}, Error message: ${errorMessage}`);
                });
        },
        async logout() {
            signOut(auth).then(() => {
                console.log('Signed out successfully');
                this.user = {};
                useTeamStore().clearData();
                this.router.push(RouteEnum.AUTH.path);
            }).catch((error) => {
                console.log(`Error signing out: ${error}`);
            });
        },
        async register(credentials) {
            // password must be at least 6 characters long
            await createUserWithEmailAndPassword(auth, credentials.email, credentials.password)
                .then(async (userCredential) => {
                // Signed up
                const firebaseUser = userCredential.user;
                // create user in users collection
                await this.createUser(firebaseUser, credentials);
                this.user = firebaseUser;
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(`Error code: ${errorCode}, Error message: ${errorMessage}`);
                });
            await this.router.push(RouteEnum.HOME.path);
        },
        async createUser(user, credentials) {
            const userDoc = {
                uid: user.uid,
                email: user.email,
                name: credentials.name || "", // Optional additional fields
                createdAt: new Date(),
            };
            // Format dotazu je db - database, users - kolekce, user.uid - dokument v kolekci
            await setDoc(doc(db, "users", user.uid), userDoc);
            console.log("User registered and added to Firestore:", userDoc);
        }
    }
})
