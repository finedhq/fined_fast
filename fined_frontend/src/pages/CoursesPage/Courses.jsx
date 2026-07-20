import React, { useEffect, useState, useRef } from "react"
import instance from "../../lib/axios"
import toast from 'react-hot-toast'
import { useAuth0 } from "@auth0/auth0-react"
import { useNavigate } from "react-router-dom"
import SmartImage from "../../uiComponents/SmartImage"

export default function Courses() {
	const navigate = useNavigate()

	const { user, isLoading, isAuthenticated } = useAuth0();
	const [email, setEmail] = useState("")
	const [courses, setCourses] = useState([])
	const [ongoingCourse, setOngoingCourse] = useState({})
	const [isFetchingOngoing, setIsFetchingOngoing] = useState(false)
	const [loading, setLoading] = useState(true)
	const [warning, setWarning] = useState("")
	const [error, setError] = useState("")

	const carouselRef = useRef(null)

    useEffect(() => {
        if (isLoading || !isAuthenticated || !user) return;
        setEmail(user.email || '');
    }, [isLoading, isAuthenticated, user]);

	async function fetchCourses() {
		setLoading(true)
		try {
			const res = await instance.get("/courses/getall")
			if (res.data.length > 0) {
				setCourses(res.data)
				setLoading(false)
			}
		} catch (err) {
			setError("Failed to load courses.")
		}
	}

	async function fetchOngoingCourses() {
		setIsFetchingOngoing(true)
		try {
			const res = await instance.post("/courses/getongoingcourse", { email })
			if (res.data?.title) {
				setOngoingCourse(res.data)
			}
		} catch (err) {
			setWarning("Failed to load ongoing course.")
		} finally {
			setIsFetchingOngoing(false)
		}
	}

	useEffect(() => {
		fetchCourses()
	}, [email])

	useEffect(() => {
		if (!email) return
		fetchOngoingCourses()
	}, [email])

	return (
		<div className="bg-gray-100 min-h-screen flex flex-col pb-5">
			{isAuthenticated ?
				<main className="grow px-4 sm:px-10 sm:pt-5">
					{loading ?
						<div className="min-h-screen w-full px-4 sm:px-10 pt-5 bg-gray-100 space-y-12 animate-pulse">
							<div>
								<div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
								<div className="flex gap-12 mb-6">
									{[...Array(1)].map((_, i) => (
										<div key={i} className="bg-gray-100 rounded-xl px-4 py-3 w-full sm:w-1/4 h-44 space-y-3 shrink-0 ml-1 border border-gray-300">
											<div>
												<div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
												<div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
												<div className="h-3 bg-gray-200 rounded w-5/6"></div>
											</div>
											<div className="flex justify-between">
												<div className="w-2/5 h-20 bg-gray-300 rounded-md"></div>
												<div className="flex flex-col justify-center items-center w-3/5">
													<div className="flex gap-2 mb-2">
														<div className="h-3 w-14 bg-gray-300 rounded"></div>
														<div className="h-3 w-2 bg-gray-300 rounded"></div>
														<div className="h-3 w-14 bg-gray-300 rounded"></div>
													</div>
													<div className="h-8 w-24 bg-gray-300 rounded-full mt-2"></div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							<div>
								<div className="flex justify-between items-center mb-4">
									<div className="h-6 bg-gray-300 rounded w-1/3"></div>
									<div className="flex space-x-2">
										<div className="w-10 h-10 bg-gray-200 rounded-full"></div>
										<div className="w-10 h-10 bg-gray-200 rounded-full"></div>
									</div>
								</div>
								<div className="flex flex-wrap gap-y-6 gap-x-8.5 mx-4 mb-10 h-185 overflow-hidden">
									{[...Array(6)].map((_, i) => (
										<div key={i} className="bg-white h-90 w-72 rounded-xl shadow">
											<div className="h-40 bg-gray-300 rounded-t-xl"></div>
											<div className="p-4 space-y-3">
												<div className="h-3 w-1/2 bg-gray-300 rounded"></div>
												<div className="h-4 w-full bg-gray-300 rounded"></div>
												<div className="h-3 w-5/6 bg-gray-300 rounded"></div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
						:
						<div>
							<h2 className="text-xl font-semibold mb-4">Continue Learning</h2>
							<div className="flex gap-12 w-full mb-6 px-4" >
								{isFetchingOngoing ? (
									<div className="bg-white rounded-xl px-4 py-3 w-full sm:w-1/4 space-y-3 sm:shrink-0 border border-gray-300 animate-pulse">
										<div>
											<div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
											<div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
											<div className="h-3 bg-gray-200 rounded w-5/6"></div>
										</div>
										<div className="flex justify-between">
											<div className="w-2/5 h-20 bg-gray-300 rounded-md"></div>
											<div className="flex flex-col justify-center items-center w-3/5">
												<div className="flex gap-2 mb-2">
													<div className="h-3 w-14 bg-gray-300 rounded"></div>
													<div className="h-3 w-2 bg-gray-300 rounded"></div>
													<div className="h-3 w-14 bg-gray-300 rounded"></div>
												</div>
												<div className="h-8 w-24 bg-gray-300 rounded-full mt-2"></div>
											</div>
										</div>
									</div>
								) : (
									<div className="bg-white rounded-xl hover:shadow-md transition px-4 py-3 w-full sm:w-1/4 h-fit space-y-3 sm:shrink-0 border border-gray-300">
										<div>
											<h3 className="font-semibold text-cyan-800 text-base tracking-wide sm:mb-2">
												{ongoingCourse?.title || courses[courses.length - 1]?.title}
											</h3>
											<p className="text-xs text-gray-600 mb-2 max-h-16 whitespace-pre-wrap truncate">
												{ongoingCourse?.description || courses[courses.length - 1]?.description}
											</p>
										</div>
										<div className="flex gap-5">
											<SmartImage
												src={ongoingCourse?.thumbnail_url || courses[courses.length - 1]?.thumbnail_url}
												alt={ongoingCourse?.title || courses[courses.length - 1]?.title}
												className="object-cover w-full h-full"
												containerClassName="w-2/5 h-20 rounded-md overflow-hidden relative"
											/>
											<div className="flex flex-col justify-center items-center w-full">
												<div className="flex gap-1">
													<p className="text-xs text-gray-500 mb-1">
														{ongoingCourse?.modules_count || courses[courses.length - 1]?.modules_count} Modules
													</p>
													<p className="text-xs text-gray-500 mb-1">&bull;</p>
													<p className="text-xs text-gray-500 mb-1">
														{ongoingCourse?.duration || courses[courses.length - 1]?.duration} mins
													</p>
												</div>
												<div className="w-full" >
													<button
														onClick={() => navigate(`/courses/course/${ongoingCourse?.id || courses[courses.length - 1]?.id}`)}
														className="bg-amber-400 text-white px-4 py-1 w-full sm:px-4 sm:py-2 rounded-full self-end mt-2 cursor-pointer"
													>
														{ongoingCourse?.id ? "Continue" : "Start Now"}
													</button>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>

							<div className="w-full pb-10">
								<div className="flex justify-between" >
									<h2 className="text-xl font-semibold mb-4">Recommended Courses</h2>
								</div>
								<div ref={carouselRef} className="flex flex-col sm:flex-row gap-6">
									{courses.map((course) => (
										<CourseCard key={course.id} course={course} isAuthenticated={isAuthenticated} navigate={navigate} />
									))}
								</div>
							</div>
						</div>
					}
				</main>
				:
				<div className="w-full px-4 sm:px-10 py-5">
					<div className="flex justify-between" >
						<h2 className="text-xl font-semibold">Recommended Courses</h2>
					</div>
					<div ref={carouselRef} className="flex flex-col sm:flex-row gap-6 mt-4">
						{courses.map((course) => (
							<CourseCard key={course.id} course={course} isAuthenticated={isAuthenticated} navigate={navigate} />
						))}
					</div>
				</div>
			}
			{warning && (
				<div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center">
					<div className="bg-white p-6 rounded-2xl shadow-xl w-125 space-y-4">
						<p className="text-xl font-bold text-red-600">⚠️ Alert</p>
						<p className="text-md font-semibold text-gray-700">
							{warning}
						</p>
						<div className="flex justify-end pt-4">
							<button
								onClick={() => setWarning("")}
								className={`bg-amber-400 hover:bg-amber-500 transition-all duration-200 text-white px-4 py-2 rounded-lg cursor-pointer`}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{error && (
				<div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center">
					<div className="bg-white p-6 rounded-2xl shadow-xl w-125 space-y-4">
						<p className="text-xl font-bold text-red-600">⚠️ Alert</p>
						<p className="text-md font-semibold text-gray-700">
							{error}
						</p>
						<div className="flex justify-end pt-4">
							<button
								onClick={() => { setError(""); setLoading(false); navigate("/") }}
								className={`bg-amber-400 hover:bg-amber-500 transition-all duration-200 text-white px-4 py-2 rounded-lg cursor-pointer`}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

		</div>
	);
}

function CourseCard({ course, isAuthenticated, navigate }) {
	return (
		<div
			onClick={() => {
				if (isAuthenticated) {
					navigate(`/courses/course/${course.id}`);
				} else {
					toast.error("Please sign in");
				}
			}}
			className="bg-white rounded-xl border border-gray-300 hover:shadow-md transition h-80 sm:w-80 sm:h-90 cursor-pointer overflow-hidden flex flex-col">
			<SmartImage
				src={course.thumbnail_url}
				alt={course.title}
				className="object-cover w-full h-full"
				containerClassName="w-full h-40 sm:h-48 mb-2 relative"
			/>
			<div className="p-4 space-y-2 flex-grow" >
				<div className="flex gap-1" >
					<p className="text-xs text-gray-500 mb-1">{course.modules_count}  Modules</p>
					<p className="text-xs text-gray-500 mb-1">&bull;</p>
					<p className="text-xs text-gray-500 mb-1">{course.duration} mins</p>
				</div>
				<h3 className="font-semibold text-cyan-800 text-base tracking-wide mb-2">
					{course.title}
				</h3>
				<p className="text-xs text-gray-600 mb-2 whitespace-pre-wrap h-16 truncate">{course.description}</p>
			</div>
		</div>
	);
}
