'use client';

import React, { useEffect, useState } from 'react'
import instance from '../../lib/axios'
import toast from 'react-hot-toast'
import { useNavigate as useRouter } from 'react-router-dom'
import { useAuth0 as useUser } from '@auth0/auth0-react'

const Notifications = () => {

	const router = useRouter()

	const { user, isLoading } = useUser()
	const isAuthenticated = !!user;
	const [role, setrole] = useState("")

	const [email, setEmail] = useState("")

	const [notifications, setNotifications] = useState([])
	const [loading, setLoading] = useState(true)

	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

	useEffect(() => {
		if (isLoading || !isAuthenticated) return;

		fetch("/api/auth/me")
			.then(res => res.json())
			.then(data => {
				console.log("Data from /api/me: ", data);
				setEmail(user.email || '')
				setrole(data.roles?.[0] || "");
			})
			.catch(() => setrole(""));

	}, [isLoading, isAuthenticated]);
	useEffect(() => {
		console.log("Role updated:", role);
	}, [role]);

	const fetchNotifications = async () => {
		setLoading(true)
		try {
			const res = await instance.post("/home/notifications", { email })
			if (res.data) {
				setNotifications(res.data || [])
				const response = await instance.post("/home/updatenotifications", { email })
			}
		} catch (err) {
			toast.error("Failed to load notifications.")
		} finally {
			setLoading(false)
		}
	};

	useEffect(() => {
		if (!email) return
		fetchNotifications()
	}, [email])

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	return (
		<div className="font-inter text-[#1e1e1e] bg-gray-100 min-h-screen">
			<main className="max-w-3xl mx-auto px-6 py-8">
				<h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">🔔 Notifications</h2>

				{loading ? (
					<ul className="space-y-4 animate-pulse">
						{Array(4).fill(0).map((_, i) => (
							<li key={i} className="p-6 rounded-lg bg-gray-200">
								<div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
								<div className="h-3 bg-gray-300 rounded w-1/2"></div>
							</li>
						))}
					</ul>
				) : notifications.length === 0 ? (
					<p className="text-gray-500">No notifications yet.</p>
				) : (
					<ul className="space-y-4">
						{notifications.map((note, index) => (
							<li key={index} className={`p-4 rounded-lg shadow-sm transition ${note.seen ? "bg-gray-200" : "bg-blue-50 border border-blue-300"}`} >
								<p className="text-sm md:text-base">{note.content}</p>
								<small className="block mt-2 text-xs text-gray-500">
									{new Date(note.created_at).toLocaleString()}
								</small>
							</li>
						))}
					</ul>
				)}
			</main>
		</div>
	);
};

export default Notifications;
