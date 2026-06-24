'use client';

import { FaArrowLeft } from "react-icons/fa"
import React, { useEffect, useState } from 'react'
import instance from '../../lib/axios'
import toast from 'react-hot-toast'
import { useAuth0 as useUser } from "@auth0/auth0-react";
import { useNavigate as useRouter, useSearchParams } from "react-router-dom";

const PoliciesPage = () => {

	const router = useRouter();
	const searchParams = useSearchParams()

	const { user, isLoading } = useUser();
	const isAuthenticated = !!user;
	const [role, setrole] = useState("")
	const [email, setEmail] = useState("")
	const [recommendedSchemes, setRecommendedSchemes] = useState([])
	const [course_id, setCourseId] = useState("")

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

	useEffect(() => {
  const idFromQuery = searchParams.get("courseId")
  if (idFromQuery) {
    setCourseId(idFromQuery)
  }
}, [searchParams])


	const fetchRecommendations = async () => {
		try {
			const res = await instance.post("/home/recommendations", { email, course_id });
			setRecommendedSchemes(res.data.recommendations);
		} catch (err) {
			toast.error(`Failed to load recommended schemes. Error: ${err}`);
		}
	};

	useEffect(() => {
		if (email) {
			fetchRecommendations()
		}
	}, [email])

	return (
		<div className="min-h-screen bg-gray-100 px-4 pb-5 text-gray-800">
			<div className="max-w-5xl mx-auto py-10">
				<div className="bg-amber-300 p-6 mb-8 rounded-b-3xl" >
					<div className="flex items-center justify-between mb-4" >
						{/* Back Button */}
						<button onClick={() => router.push("/home")} className="flex items-center text-sm font-medium cursor-pointer rounded-full bg-white p-2">
							<FaArrowLeft className="text-amber-400 text-xl" />
						</button>

						{/* Title */}
						<h1 className="text-center text-lg sm:text-2xl font-semibold text-white">
							Discover Best Schemes For You
						</h1>
						<div></div>
					</div>

					{/* Description */}
					<p className="text-xs sm:text-sm text-justify font-medium text-white mb-4">
						This feature helps you discover the best financial products—like savings accounts, debit cards, FDs, and mutual funds—tailored just for you. As you interact with FinEd’s website and answer simple questions about your income, spending habits, and goals, our system smartly matches your profile with suitable schemes from trusted banks like SBI, HDFC, ICICI, and Kotak. No more guesswork—get recommendations that actually fit your financial journey.
					</p>

					{/* Disclaimer */}
					<p className="text-[9px] sm:text-xs text-justify text-white font-medium rounded-md mb-4">
						<span className="font-bold">Disclaimer</span><br />
						FinEd is not affiliated with or endorsed by any of the banks mentioned. Currently, recommendations are limited to schemes from SBI, HDFC, ICICI, and Kotak Mahindra Bank—our team is actively working to expand this list. All suggestions are generated based on your inputs and our internal algorithm. While we aim to provide useful insights, these should not be considered professional financial advice. Please evaluate the options carefully before making any financial decisions.
					</p>

					{/* Call to action */}
					<div className="flex items-start gap-3 text-blue-700 px-4 py-3 text-base sm:text-lg rounded-md">
						<img
							src="/ellipse.png"
							alt="emoji"
							className="w-12 h-12 sm:h-14 sm:w-14"
						/>
						<p>
							<span className="font-semibold">To get more accurate suggestions</span>, just complete our courses or answer a quick questionnaire—it only takes a minute!{" "}
						</p>
					</div>
				</div>

				{/* Policies */}
				<div className="space-y-3">
					{recommendedSchemes.map((scheme, idx) => (
						<div
							onClick={() => { scheme.short_name ? router.push(`/${scheme.short_name}`) : toast("Coming soon !") }}
							key={idx}
							className="flex justify-between items-start bg-white px-4 py-3 rounded-lg shadow-sm cursor-pointer hover:bg-gray-300 transition-all duration-200"
						>
							{/* Left */}
							<div className="flex gap-2 sm:gap-3 items-start">
								<span className="text-sm font-semibold mt-2">{idx + 1}</span>
								<div className='h-9 w-9' >
									<img src={scheme?.bank_name === "HDFC Bank" ? "/hdfc.png" : scheme?.bank_name === "SBI Bank" ? "/sbi.png" : scheme?.bank_name === "ICICI Bank" ? "/icici.png" : "/kotak.png"} alt='bank_logo' className='h-9 w-9' />
								</div>
								<div>
									<p className="font-semibold text-sm text-gray-900">{scheme.bank_name} {scheme.scheme_name}</p>
									<p className="text-xs text-gray-600 leading-snug">{scheme.description}</p>
								</div>
							</div>

							{/* Right */}
							<div className="text-purple-700 text-base font-semibold whitespace-nowrap mt-2 sm:mt-0">
								{scheme.rate}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default PoliciesPage;
