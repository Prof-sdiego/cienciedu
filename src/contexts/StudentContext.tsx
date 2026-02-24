import { useState, createContext, useContext, ReactNode } from "react";

interface Student {
  id: string;
  name: string;
  pin: string;
}

interface StudentContextType {
  student: Student | null;
  setStudent: (s: Student | null) => void;
}

const StudentContext = createContext<StudentContextType>({
  student: null,
  setStudent: () => {},
});

export const useStudent = () => useContext(StudentContext);

export const StudentProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudent] = useState<Student | null>(null);

  return (
    <StudentContext.Provider value={{ student, setStudent }}>
      {children}
    </StudentContext.Provider>
  );
};
