import { create } from "zustand"
import axios from "axios";
import instance from "../lib/axios";

export const useMessagesStore = create((set, get) => ({

	savings: [],
	setsavings: (data) => set({ savings: data }),
	fd: [],
	setfd: (data) => set({ fd: data }),
	taxsaverfd: [],
	settaxsaverfd: (data) => set({ taxsaverfd: data }),
	rd: [],
	setrd: (data) => set({ rd: data }),
	ppf: [],
	setppf: (data) => set({ ppf: data }),
	nps: [],
	setnps: (data) => set({ nps: data }),
	unnaticard: [],
	setunnaticard: (data) => set({ unnaticard: data }),
	simplysave: [],
	setsimplysave: (data) => set({ simplysave: data }),
	kotaksavings: [],
	setkotaksavings: (data) => set({ kotaksavings: data }),
	hdfcsavings: [],
	sethdfcsavings: (data) => set({ hdfcsavings: data }),
	digihdfcsavings: [],
	setdigihdfcsavings: (data) => set({ digihdfcsavings: data }),
	maxhdfcsavings: [],
	setmaxhdfcsavings: (data) => set({ maxhdfcsavings: data }),
	hdfcfd: [],
	sethdfcfd: (data) => set({ hdfcfd: data }),
	icicisavings: [],
	seticicisavings: (data) => set({ icicisavings: data }),
	icicibasicsavings: [],
	seticicibasicsavings: (data) => set({ icicibasicsavings: data }),
	iciciyoungsavings: [],
	seticiciyoungsavings: (data) => set({ iciciyoungsavings: data }),
	icicifd: [],
	seticicifd: (data) => set({ icicifd: data }),
	icicird: [],
	seticicird: (data) => set({ icicird: data }),
	kotakace: [],
	setkotakace: (data) => set({ kotakace: data }),
	hdfcrd: [],
	sethdfcrd: (data) => set({ hdfcrd: data }),
	hdfcmoney: [],
	sethdfcmoney: (data) => set({ hdfcmoney: data }),


	getSBISavings: async () => {
		try {
			const res = await instance.get('/sbi/savings');
			if (res.data) {
				set({ savings: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching Savings data:', error);
		}

	},

	getSBIfd: async () => {
		try {
			const res = await instance.get('/sbi/fd');
			if (res.data) {
				set({ fd: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getSBITaxSaverfd: async () => {
		try {
			const res = await instance.get('/sbi/taxsaverfd');
			if (res.data) {
				set({ taxsaverfd: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching Savings data:', error);
		}

	},

	getSBIrd: async () => {
		try {
			const res = await instance.get('/sbi/rd');
			if (res.data) {
				set({ rd: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getSBIppf: async () => {
		try {
			const res = await instance.get('/sbi/ppf');
			if (res.data) {
				set({ ppf: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getSBInps: async () => {
		try {
			const res = await instance.get('/sbi/nps');
			if (res.data) {
				set({ nps: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getSBIUnnatiCard: async () => {
		try {
			const res = await instance.get('/sbi/unnaticard');
			if (res.data) {
				set({ unnaticard: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getSBISimplySave: async () => {
		try {
			const res = await instance.get('/sbi/simplysave');
			if (res.data) {
				set({ simplysave: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getKotakSavings: async () => {
		try {
			const res = await instance.get('/kotak/savings');
			if (res.data) {
				set({ kotaksavings: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getHDFCSavings: async () => {
		try {
			const res = await instance.get('/hdfc/savings');
			if (res.data) {
				set({ hdfcsavings: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getHDFCDigiSavings: async () => {
		try {
			const res = await instance.get('/hdfc/digisave');
			if (res.data) {
				set({ digihdfcsavings: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getHDFCMaxSavings: async () => {
		try {
			const res = await instance.get('/hdfc/maxsave');
			if (res.data) {
				set({ maxhdfcsavings: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getHDFCFD: async () => {
		try {
			const res = await instance.get('/hdfc/fd');
			if (res.data) {
				set({ hdfcfd: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getICICISavings: async () => {
		try {
			const res = await instance.get('/icici/savings');
			if (res.data) {
				set({ icicisavings: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getICICIBasicSavings: async () => {
		try {
			const res = await instance.get('/icici/basicsavings');
			if (res.data) {
				set({ icicibasicsavings: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getICICIYoungSavings: async () => {
		try {
			const res = await instance.get('/icici/youngsavings');
			if (res.data) {
				set({ iciciyoungsavings: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getICICIFD: async () => {
		try {
			const res = await instance.get('/icici/fd');
			if (res.data) {
				set({ icicifd: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getICICIrd: async () => {
		try {
			const res = await instance.get('/icici/rd');
			if (res.data) {
				set({ icicird: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}

	},

	getkotakace: async () => {
		try {
			const res = await instance.get('/kotak/acesavings');
			if (res.data) {
				set({ kotakace: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching FD data:', error);
		}
	},

	getHDFCmoney: async () => {
		try {
			const res = await instance.get('/hdfc/moneyback');
			if (res.data) {
				set({ hdfcmoney: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching Moneyback data:', error);
		}
	},

	getHDFCrd: async () => {
		try {
			const res = await instance.get('/hdfc/rd');
			if (res.data) {
				set({ hdfcrd: res.data });
			}
		}
		catch (error) {
			console.error('Error fetching RD data:', error);
		}
	},

}))
