import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Admin } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  admin: Admin | null;
  adminProfile: Admin | null; // For backwards compatibility
  role: 'super_admin' | 'admin' | 'support' | null;
  permissions: string[] | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for authentication state changes
    console.log("[AuthDebug] Registrando listener onAuthStateChanged...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[AuthDebug] onAuthStateChanged disparado. Usuário:", firebaseUser ? `${firebaseUser.email} (UID: ${firebaseUser.uid})` : "Nenhum");
      setLoading(true);
      if (firebaseUser) {
        try {
          const uid = firebaseUser.uid;
          console.log("[AuthDebug] UID usado na busca do Firestore 'admins':", uid);
          const docRef = doc(db, 'admins', uid);
          const docSnap = await getDoc(docRef);
          
          console.log("[AuthDebug] Resultado do getDoc em admins/{uid}:", docSnap.exists() ? "Documento EXISTE" : "Documento NÃO existe");

          if (docSnap.exists()) {
            const adminData = docSnap.data() as Admin;
            console.log("[AuthDebug] Dados do administrador recuperados:", adminData);
            
            // Validate if status is active or active boolean is true
            const isActive = adminData.active === true || (adminData.active !== false && adminData.status === 'active');
            console.log("[AuthDebug] Validação de status ativo:", isActive ? "ATIVO" : "INATIVO");

            if (!isActive) {
              console.log("[AuthDebug] Acesso bloqueado: administrador inativo ou sem flag active.");
              setError("Sem permissão de administrador (perfil inativo).");
              setAdmin(null);
              setUser(null);
              await signOut(auth);
            } else {
              console.log("[AuthDebug] Acesso concedido para admin:", adminData);
              setUser(firebaseUser);
              setAdmin(adminData);
              setError(null);
            }
          } else {
            console.log("[AuthDebug] Documento admins não existe para o UID:", uid);
            
            // Check for bootstrap admin: gptwpedrocosta@gmail.com
            if (firebaseUser.email === 'gptwpedrocosta@gmail.com') {
              console.log("[AuthDebug] Criando documento bootstrap para o email de teste:", firebaseUser.email);
              const bootstrapAdmin: Admin = {
                id: firebaseUser.uid,
                name: "Pedro Costa",
                email: "gptwpedrocosta@gmail.com",
                role: 'super_admin',
                status: 'active'
              };
              
              // Include permissions and active boolean in document
              const extendedAdmin = {
                ...bootstrapAdmin,
                permissions: [
                  "dashboard", "users", "drivers", "rides", "deliveries", 
                  "financial", "map", "notifications", "settings", 
                  "actions.approve_driver", "actions.block_user", 
                  "actions.send_notification", "actions.simulate_ride"
                ],
                active: true
              };

              await setDoc(docRef, extendedAdmin);
              console.log("[AuthDebug] Documento bootstrap admin criado com sucesso.");
              setUser(firebaseUser);
              setAdmin(extendedAdmin as any);
              setError(null);
            } else {
              console.log("[AuthDebug] Bloqueando acesso: usuário logado no Auth mas sem registro na coleção admins.");
              setError("Sem permissão de administrador.");
              setAdmin(null);
              setUser(null);
              await signOut(auth);
            }
          }
        } catch (err: any) {
          console.error("[AuthDebug] Erro ao validar permissões de administrador no Firestore:", err);
          setError("Erro de permissão ou conexão com o Firestore.");
          setAdmin(null);
          setUser(null);
          await signOut(auth);
        }
      } else {
        console.log("[AuthDebug] Nenhum usuário logado no Auth.");
        setUser(null);
        setAdmin(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    console.log("[AuthDebug] Tentando efetuar login via Firebase Auth para:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      console.log("[AuthDebug] Login bem-sucedido no Firebase Auth. UID:", userCredential.user.uid);
    } catch (err: any) {
      console.error("[AuthDebug] Falha no login do Firebase Auth:", err);
      let localizedError = "Erro ao realizar login. Verifique suas credenciais.";
      
      // Match exactly the requested error messages:
      // "Usuário não encontrado"
      // "Senha incorreta"
      // "Sem permissão de administrador" is handled in the Firestore onAuthStateChanged observer
      if (err.code === 'auth/user-not-found') {
        localizedError = "Usuário não encontrado.";
      } else if (err.code === 'auth/wrong-password') {
        localizedError = "Senha incorreta.";
      } else if (err.code === 'auth/invalid-credential') {
        // Many modern Firebase clients use auth/invalid-credential for both user-not-found and wrong-password for security.
        // We will perform an automatic creation attempt to distinguish whether the email exists at all.
        try {
          console.log("[AuthDebug] Recebido auth/invalid-credential. Testando se o email existe via createUser...");
          const tempUserCred = await createUserWithEmailAndPassword(auth, email, pass);
          
          // If creation succeeded, it means the email did NOT exist previously!
          if (email === 'gptwpedrocosta@gmail.com') {
            console.log("[AuthDebug] Registro automático do bootstrap admin concluído com sucesso. UID:", tempUserCred.user.uid);
            setLoading(false);
            return;
          } else {
            console.log("[AuthDebug] Conta criada temporariamente para fins de teste de existência. Excluindo conta temporária e reportando 'Usuário não encontrado'.");
            await tempUserCred.user.delete();
            localizedError = "Usuário não encontrado.";
          }
        } catch (createErr: any) {
          console.log("[AuthDebug] Resultado da tentativa de criação de teste:", createErr.code);
          if (createErr.code === 'auth/email-already-in-use') {
            // Email is in use, meaning the account exists. Therefore, the signIn error was a wrong password!
            localizedError = "Senha incorreta.";
          } else if (createErr.code === 'auth/weak-password') {
            // Creation failed because password was weak, but the user didn't exist anyway!
            localizedError = "Usuário não encontrado.";
          } else {
            localizedError = "Senha incorreta.";
          }
        }
      } else if (err.code === 'auth/invalid-email') {
        localizedError = "Formato de email inválido.";
      } else if (err.code === 'auth/network-request-failed') {
        localizedError = "Erro de conexão com o servidor de autenticação.";
      } else if (err.code === 'auth/operation-not-allowed') {
        localizedError = "O provedor de login com Email/Senha está desativado no Firebase Console. Por favor, acesse o Firebase Console, vá em Authentication > Sign-in method e ative o provedor 'E-mail/senha'.";
      }
      
      setError(localizedError);
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Erro no logout:", err);
    } finally {
      setUser(null);
      setAdmin(null);
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  // Derive role and permissions
  const role = admin?.role || null;
  const permissions = (admin as any)?.permissions || (role === 'super_admin' ? [
    "dashboard", "users", "drivers", "rides", "deliveries", 
    "financial", "map", "notifications", "settings", 
    "actions.approve_driver", "actions.block_user", 
    "actions.send_notification", "actions.simulate_ride"
  ] : role === 'admin' ? [
    "dashboard", "users", "drivers", "rides", "deliveries", 
    "financial", "map", "notifications", "settings", 
    "actions.approve_driver", "actions.block_user", 
    "actions.send_notification"
  ] : role === 'support' ? [
    "dashboard", "users", "drivers", "rides", "deliveries", "map"
  ] : []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      admin, 
      adminProfile: admin, 
      role, 
      permissions, 
      loading, 
      error, 
      login, 
      logout, 
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
