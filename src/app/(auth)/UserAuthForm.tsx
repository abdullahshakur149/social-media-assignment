'use client';

import Button from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useToast } from '@/hooks/useToast';
import { AtSign, LogInSquare } from '@/svg_components';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { z } from 'zod';

const usernameSchema = z.string().trim().min(3);
const passwordSchema = z.string().min(6);
export function UserAuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [picture, setPicture] = useState<File | null>(null);
  const [loading, setLoading] = useState({
    email: false,
  });
  // Disable buttons when loading
  const areButtonsDisabled = loading.email;
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('from') || '/feed';
  const { showToast } = useToast();

  const onUsernameChange = useCallback((text: string) => {
    setUsername(text);
  }, []);
  const onPasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);
  const onFirstNameChange = useCallback((text: string) => {
    setFirstName(text);
  }, []);
  const onLastNameChange = useCallback((text: string) => {
    setLastName(text);
  }, []);
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPicture(e.target.files?.[0] || null);
  }, []);

  const submitCredentials = useCallback(async () => {
    setLoading((prev) => ({
      ...prev,
      email: true,
    }));
    const u = usernameSchema.safeParse(username);
    const p = passwordSchema.safeParse(password);
    if (!u.success) {
      setInputError(u.error.issues[0].message);
    } else if (!p.success) {
      setInputError(p.error.issues[0].message);
    } else {
      if (mode === 'register') {
        try {
          const form = new FormData();
          form.set('username', username);
          form.set('password', password);
          form.set('firstName', firstName);
          form.set('lastName', lastName);
          if (picture) form.set('picture', picture);
          const res = await fetch('/api/users', { method: 'POST', body: form });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            showToast({ type: 'error', title: data?.message || 'Registration failed' });
            setLoading((prev) => ({ ...prev, email: false }));
            return;
          }
          showToast({ type: 'success', title: 'Account created' });
        } catch {
          showToast({ type: 'error', title: 'Registration failed' });
          setLoading((prev) => ({ ...prev, email: false }));
          return;
        }
      }
      const signInResult = await signIn('credentials', {
        username,
        password,
        redirect: false,
        callbackUrl,
      });
      if (!signInResult?.ok) {
        showToast({ type: 'error', title: 'Invalid credentials' });
      } else {
        showToast({ type: 'success', title: mode === 'register' ? 'Registered and logged in' : 'Logged in' });
      }
    }
    setLoading((prev) => ({ ...prev, email: false }));
  }, [username, password, firstName, lastName, picture, callbackUrl, showToast, mode]);

  // Social sign-in removed

  return (
    <>
      <div className="mb-4">
        <TextInput
          value={username}
          onChange={onUsernameChange}
          label="Username"
          errorMessage={inputError || undefined}
          Icon={AtSign}
        />
      </div>
      <div className="mb-4">
        <TextInput value={password} onChange={onPasswordChange} label="Password" type="password" />
      </div>
      {mode === 'register' && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextInput value={firstName} onChange={onFirstNameChange} label="First name" />
          <TextInput value={lastName} onChange={onLastNameChange} label="Last name" />
        </div>
      )}
      {mode === 'register' && (
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border file:border-border file:bg-card file:px-3 file:py-2"
          />
        </div>
      )}
      <div className="mb-5">
        <Button
          onPress={submitCredentials}
          shape="pill"
          expand="full"
          Icon={LogInSquare}
          loading={loading.email}
          isDisabled={areButtonsDisabled}>
          {mode === 'login' ? 'Login' : 'Sign up'} with Username & Password
        </Button>
      </div>
    </>
  );
}
