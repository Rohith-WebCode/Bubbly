import { create } from 'zustand'
import { axiosInstance } from '../lib/axios.js'
import toast from 'react-hot-toast';
import {io} from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/" ;

export const useAuthStore = create((set,get) => ({
    authUser: null, // Stores authenticated user data
    isSigningUp: false, // Tracks signup process
    isLoggingIng: false, // Tracks login process (typo: should be "isLoggingIn")
    isUpdatingProfile: false, // Tracks profile update process
    isCheckingAuth: true, // Tracks authentication check status
    onlineUsers:[],
    socket:null,
    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check"); // API call to check authentication
            set({ authUser: res.data }); // Updates state with authenticated user data
            get().connectSocket();
        } catch (error) {
            console.log("error in checkAuth:", error);
            set({ authUser: null }); // Resets user data if auth check fails
        } finally {
            set({ isCheckingAuth: false }); // Stops checking authentication
        }
    },
    signup:async (data)=>{
        set({isSigningUp:true});
        try {
            const res = await axiosInstance.post("/auth/signup",data);
            set({authUser:res.data})
            toast.success("Account created successfully")
            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message)
        }finally{
            set({isSigningUp: false})
        }

    },

    login:async(data)=>{
     set({isLoggingIng: true})

     try {
        const res = await axiosInstance.post("/auth/login",data);
        set({authUser:res.data})
        toast.success("Logged in successfully")

        get().connectSocket();
    } catch (error) {
        toast.error(error.response.data.message)
    }finally{
        set({isLoggingIng: false})
    }
    },
    logout:async()=>{
        
        try {
            await axiosInstance.post("/auth/logout");
            set({authUser:null});
            toast.success("Logged out successfully")
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },

    updateProfile:async(data) =>{
        set({isUpdatingProfile: true})

     try {
        const res = await axiosInstance.put("/auth/update-profile",data);
        set({authUser:res.data})
        toast.success("Profile updated successfully")
    } catch (error) {
        console.log("error in updateProfile:",error);
        toast.error(error.response.data.message)
    }finally{
        set({isUpdatingProfile: false})
    }
    },

    connectSocket:async() =>{
     const {authUser} = get()
     if (!authUser || get().socket?.connected) return;

     const socket = io(BASE_URL,{
        query:{
            userId:authUser._id
        }
     })
     socket.connect()
     set({socket:socket});

     socket.on("getOnlineUsers",(userIds)=>{
        set({onlineUsers:userIds})
     })
    },

    disconnectSocket:async() =>{
        if(get().socket?.connected) get().socket.disconnect();
    },
}));

