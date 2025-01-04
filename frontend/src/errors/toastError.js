import { toast } from "react-hot-toast";
import { i18n } from "../translate/i18n";
import { isString } from 'lodash';

const toastError = err => {
	const errorMsg = err.response?.data?.error;
	if (errorMsg) {
		if (i18n.exists(`backendErrors.${errorMsg}`)) {
			toast.error(i18n.t(`backendErrors.${errorMsg}`), {
				id: errorMsg,
				duration: 2000,
				// hideProgressBar: false,
				// closeOnClick: true,
				// pauseOnHover: false,
				// draggable: true,
				// progress: undefined,
				// theme: "light",
			});
			return
		} else {
			toast.error(errorMsg, {
				id: errorMsg,
				duration: 2000,
				// hideProgressBar: false,
				// closeOnClick: true,
				// pauseOnHover: false,
				// draggable: true,
				// progress: undefined,
				// theme: "light",
			});
			return
		}
	} if (isString(err)) {
		toast.error(err);
		return
	} else {
		toast.error("An error occurred!");
		return
	}
};

export default toastError;
