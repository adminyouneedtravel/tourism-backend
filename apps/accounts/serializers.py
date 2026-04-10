# apps/accounts/serializers.py

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

from .models import Agency, User


# ─────────────────────────────────────────────
# Agency Serializers
# ─────────────────────────────────────────────

class AgencySerializer(serializers.ModelSerializer):
    """للقوائم وعمليات CRUD الأساسية."""
    employees_count = serializers.SerializerMethodField()
    is_approved     = serializers.SerializerMethodField()

    class Meta:
        model  = Agency
        fields = [
            'id', 'name', 'email', 'phone', 'address',
            'logo', 'commission_rate', 'currency',
            'status', 'is_active', 'is_approved',
            'employees_count', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'status', 'is_approved', 'employees_count']

    def get_employees_count(self, obj) -> int:
        return obj.employees.filter(is_active=True).count()

    def get_is_approved(self, obj) -> bool:
        return obj.is_approved


class AgencyDetailSerializer(AgencySerializer):
    """للصفحة التفصيلية — يضيف بيانات إضافية."""
    approved_at = serializers.DateTimeField(read_only=True)

    class Meta(AgencySerializer.Meta):
        fields = AgencySerializer.Meta.fields + ['approved_at', 'rejection_reason', 'updated_at']


# ─────────────────────────────────────────────
# User Serializers
# ─────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    agency_name     = serializers.SerializerMethodField()
    agency_currency = serializers.SerializerMethodField()
    agency_logo     = serializers.SerializerMethodField()
    is_admin        = serializers.SerializerMethodField()
    is_approved     = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'agency', 'agency_name',
            'agency_currency', 'agency_logo', 'avatar', 'is_admin', 'is_approved',
        ]
        read_only_fields = ['id']

    def get_agency_name(self, obj) -> str | None:
        return obj.agency.name if obj.agency else None

    def get_agency_currency(self, obj) -> str:
        return obj.agency.currency if obj.agency else 'MYR'

    def get_agency_logo(self, obj):
        if obj.agency and obj.agency.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.agency.logo.url)
            return obj.agency.logo.url
        return None

    def get_is_admin(self, obj) -> bool:
        return obj.is_admin

    def get_is_approved(self, obj) -> bool:
        return obj.is_approved


# ─────────────────────────────────────────────
# Auth Serializers
# ─────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError('اسم المستخدم أو كلمة المرور غير صحيحة')
        if not user.is_active:
            raise serializers.ValidationError('هذا الحساب غير مفعّل')
        data['user'] = user
        return data


class RegisterTouristSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'first_name', 'last_name', 'phone', 'password', 'password2']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('هذا البريد الإلكتروني مستخدم بالفعل')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'كلمتا المرور غير متطابقتين'})
        validate_password(data['password'])
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data, role='tourist', is_active=True)
        user.set_password(password)
        user.save()
        return user


class RegisterAgencySerializer(serializers.Serializer):
    """تسجيل وكالة جديدة — تُنشئ Agency + User في atomic transaction."""

    # ── بيانات الوكالة ────────────────────────────────────────────
    agency_name    = serializers.CharField(max_length=200)
    agency_phone   = serializers.CharField(max_length=20, required=False, allow_blank=True)
    agency_email   = serializers.EmailField()
    agency_address = serializers.CharField(required=False, allow_blank=True)
    commission_rate = serializers.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    currency        = serializers.ChoiceField(choices=['MYR', 'USD', 'EUR', 'SAR', 'AED'], default='MYR')

    # ── بيانات المستخدم ───────────────────────────────────────────
    username   = serializers.CharField(max_length=150)
    password   = serializers.CharField(write_only=True, min_length=8)
    password2  = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name  = serializers.CharField(required=False, allow_blank=True)
    phone      = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('اسم المستخدم مستخدم بالفعل')
        return value

    def validate_agency_email(self, value):
        if Agency.objects.filter(email=value).exists():
            raise serializers.ValidationError('هذا البريد الإلكتروني مسجل بالفعل')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'كلمتا المرور غير متطابقتين'})
        validate_password(data['password'])
        return data

    def create(self, validated_data):
        # إنشاء الوكالة بحالة pending
        agency = Agency.objects.create(
            name            = validated_data['agency_name'],
            phone           = validated_data.get('agency_phone', ''),
            email           = validated_data['agency_email'],
            address         = validated_data.get('agency_address', ''),
            commission_rate = validated_data['commission_rate'],
            currency        = validated_data.get('currency', 'MYR'),
            status          = 'pending',
            is_active       = False,
        )
        # إنشاء المستخدم مرتبطاً بالوكالة — is_active=False حتى يُوافق Admin
        user = User.objects.create_user(
            username   = validated_data['username'],
            password   = validated_data['password'],
            first_name = validated_data.get('first_name', ''),
            last_name  = validated_data.get('last_name', ''),
            phone      = validated_data.get('phone', ''),
            role       = 'agency',
            agency     = agency,
            is_active  = False,
        )
        return user


# ─────────────────────────────────────────────
# Profile & Password
# ─────────────────────────────────────────────

class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['first_name', 'last_name', 'email', 'phone', 'avatar']

    def validate_email(self, value):
        if not value:
            return value
        user = self.context['request'].user
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('هذا البريد الإلكتروني مستخدم بالفعل')
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('كلمة المرور الحالية غير صحيحة')
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    password    = serializers.CharField(write_only=True, required=False, min_length=8)
    agency_name = serializers.SerializerMethodField()
    is_admin    = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'agency', 'agency_name', 'is_admin',
            'is_active', 'date_joined', 'password',
        ]
        read_only_fields = ['id', 'date_joined']

    def get_agency_name(self, obj) -> str | None:
        return obj.agency.name if obj.agency else None

    def get_is_admin(self, obj) -> bool:
        return obj.is_admin

    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk if user else None).exists():
            raise serializers.ValidationError('هذا البريد الإلكتروني مستخدم بالفعل')
        return value

    def validate_username(self, value):
        user = self.instance
        if User.objects.filter(username=value).exclude(pk=user.pk if user else None).exists():
            raise serializers.ValidationError('اسم المستخدم مستخدم بالفعل')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance