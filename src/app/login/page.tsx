
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { doSendPasswordReset } from '@/lib/firebase-auth';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(1, { message: 'La contraseña no puede estar vacía.' }),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await login(values);
    setIsLoading(false);
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({ variant: 'destructive', title: 'Email requerido', description: 'Por favor, introduce tu email.' });
        return;
    }
    const result = await doSendPasswordReset(resetEmail);
    if(result.success) {
        toast({
          title: 'Correo de recuperación enviado',
          description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
        });
        setIsResetDialogOpen(false);
        setResetEmail('');
    } else {
        console.error("Password Reset Error:", result.error?.code, result.error?.message);
        let description = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
        if (result.error?.code === 'auth/user-not-found' || result.error?.code === 'auth/invalid-email') {
            description = 'No se encontró ninguna cuenta con este correo electrónico.';
        }
        toast({ variant: 'destructive', title: 'Error al enviar correo', description });
    }
  }

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-purple-200 to-violet-200 dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 p-4">
        <Card className="w-full max-w-sm bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl shadow-lg border-white/20">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Heart className="h-8 w-8 text-fuchsia-500" />
              <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">Agendia</CardTitle>
            </div>
            <CardDescription>Ingresa a tu cuenta para gestionar tu estudio.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Contraseña</FormLabel>
                        <Button variant="link" type="button" className="p-0 h-auto text-xs" onClick={() => setIsResetDialogOpen(true)}>
                          ¿La olvidaste?
                        </Button>
                      </div>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit"
                  className="w-full !mt-6" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center text-sm">
              ¿No tienes cuenta?{" "}
              <Link href="/signup" className="underline">
                Regístrate
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Restablecer Contraseña</DialogTitle>
                <DialogDescription>
                    Introduce tu email y te enviaremos un enlace para que puedas volver a ingresar.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input 
                    id="reset-email" 
                    type="email" 
                    value={resetEmail} 
                    onChange={(e) => setResetEmail(e.target.value)} 
                    placeholder="tu@email.com"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handlePasswordReset}>Enviar enlace</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
