import { upsertProfile } from "./profileService";

export interface StudentRecord {
	id: string;
	name: string;
	email: string;
	semester: string;
	progress: number;
	lastActive: string;
	status?: string;
}

const STUDENTS_KEY = "studySpark_students";

function readStudentsFromLocalStorage(): StudentRecord[] {
	try {
		const raw = localStorage.getItem(STUDENTS_KEY);
		return raw ? (JSON.parse(raw) as StudentRecord[]) : [];
	} catch {
		return [];
	}
}

function writeStudentsToLocalStorage(students: StudentRecord[]): void {
	localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));

	// Fire a storage-like custom event so other tabs/components can react
	try {
		window.dispatchEvent(new CustomEvent("studySpark_students_updated"));
	} catch {
		// ignore
	}
}

export function getStudents(): StudentRecord[] {
	return readStudentsFromLocalStorage();
}

export function upsertStudent(student: StudentRecord): void {
	const list = readStudentsFromLocalStorage();
	const index = list.findIndex((s) => s.id === student.id || s.email.toLowerCase() === student.email.toLowerCase());
	if (index >= 0) {
		list[index] = { ...list[index], ...student };
	} else {
		list.push(student);
	}
	writeStudentsToLocalStorage(list);
}

export function deleteStudentById(studentId: string): void {
	const list = readStudentsFromLocalStorage().filter((s) => s.id !== studentId);
	writeStudentsToLocalStorage(list);
}

export function resetStudentProgress(studentId: string): void {
	const list = readStudentsFromLocalStorage().map((s) => (s.id === studentId ? { ...s, progress: 0, status: "reset" } : s));
	writeStudentsToLocalStorage(list);
}

export function resetAllProgress(): void {
	const list = readStudentsFromLocalStorage().map((s) => ({ ...s, progress: 0, status: "reset" }));
	writeStudentsToLocalStorage(list);
}

export function updateLastActive(studentId: string, isoTimestamp: string): void {
	const list = readStudentsFromLocalStorage().map((s) => (s.id === studentId ? { ...s, lastActive: isoTimestamp } : s));
	writeStudentsToLocalStorage(list);
}

export function seedStudentFromClerkUser(opts: {
	id: string;
	name?: string | null;
	email?: string | null;
	semester?: string | null;
}): void {
	if (!opts.id || !opts.email) return;
	const record: StudentRecord = {
		id: opts.id,
		name: (opts.name || "BCA Student").trim(),
		email: opts.email,
		semester: (opts.semester || "5").toString(),
		progress: 0,
		lastActive: new Date().toISOString(),
		status: "active",
	};
	upsertStudent(record);

	// Also sync to Supabase profiles table (fire-and-forget)
	upsertProfile({
		user_id: opts.id,
		name: record.name,
		email: record.email,
		semester: parseInt(record.semester, 10) || 5,
	}).catch(() => {});
}


